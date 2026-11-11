const board = document.getElementById("game-board");
const leaves = [...document.querySelectorAll(".leaf")];
const zones = [...document.querySelectorAll(".drop-zone")];
const successMessage = document.getElementById("success-message");
const retryButton = document.getElementById("btn-retry");
const instructionSets = [...document.querySelectorAll("[data-mouse-instructions]")];
const touchControls = document.querySelector("[data-touch-controls]");
const selectedLeafStatus = document.getElementById("selected-leaf-status");
const colorButton = document.getElementById("change-leaf-color");
const returnButton = document.getElementById("return-selected-leaf");
const undoButton = document.getElementById("undo-leaf-action");
const touchResetButton = document.getElementById("reset-touch-game");
const coarsePointer = window.matchMedia("(pointer: coarse)");
const initialPositions = new Map();
const historyStack = [];

let draggedLeaf = null;
let selectedLeaf = null;
let offsetX = 0;
let offsetY = 0;
let dragStartX = 0;
let dragStartY = 0;
let hasDragged = false;
let manualMode = false;
let resizeFrame = null;
let lastViewportWidth = window.innerWidth;

function recommendedMode() {
  const phoneWidth = window.innerWidth <= 680;
  const touchLandscape = coarsePointer.matches && window.innerWidth > window.innerHeight && window.innerHeight <= 560;
  return phoneWidth || touchLandscape ? "touch" : "desktop";
}

function currentMode() {
  return document.body.dataset.mouseMode || "desktop";
}

function getLeafColor(leaf) {
  return leaf.classList.contains("yellow") ? "amarela" : "roxa";
}

function updateAccessibleState() {
  leaves.forEach((leaf, index) => {
    const location = leaf.dataset.zone ? ` no alvo ${leaf.dataset.zone.replace("zone", "")}` : "";
    const selected = leaf === selectedLeaf ? ", selecionada" : "";
    leaf.setAttribute("aria-label", `Folha ${getLeafColor(leaf)} ${index + 1}${location}${selected}`);
    leaf.setAttribute("aria-pressed", String(leaf === selectedLeaf));
  });

  zones.forEach((zone, index) => {
    const occupied = Boolean(zone.dataset.leaf);
    zone.disabled = occupied;
    zone.setAttribute("aria-label", occupied ? `Alvo ${index + 1} ocupado` : `Alvo ${index + 1} vazio`);
  });

  const hasSelection = Boolean(selectedLeaf);
  if (colorButton) colorButton.disabled = !hasSelection;
  if (returnButton) returnButton.disabled = !hasSelection;
  if (undoButton) undoButton.disabled = historyStack.length === 0;

  if (selectedLeafStatus) {
    selectedLeafStatus.textContent = selectedLeaf
      ? `${selectedLeaf.getAttribute("aria-label")}. Arraste até um alvo ou escolha uma ação.`
      : "Toque em uma folha para selecioná-la.";
  }
}

function selectLeaf(leaf) {
  selectedLeaf = leaf;
  leaves.forEach((item) => item.classList.toggle("selected", item === leaf));
  updateAccessibleState();
}

function clearSelection() {
  selectedLeaf = null;
  leaves.forEach((leaf) => leaf.classList.remove("selected"));
  updateAccessibleState();
}

function clearLeafZone(leaf) {
  if (!leaf.dataset.zone) return;

  const zone = document.getElementById(leaf.dataset.zone);
  if (zone?.dataset.leaf === leaf.id) {
    delete zone.dataset.leaf;
    zone.classList.remove("filled", "hover");
  }
  delete leaf.dataset.zone;
}

function captureInitialPositions() {
  initialPositions.clear();
  leaves.forEach((leaf) => {
    const styles = getComputedStyle(leaf);
    const touchMode = currentMode() === "touch";
    initialPositions.set(leaf.id, {
      left: styles.left,
      top: touchMode ? "auto" : styles.top,
      bottom: touchMode ? styles.bottom : "auto",
    });
  });
}

function captureGameState() {
  return leaves.map((leaf) => ({
    id: leaf.id,
    color: getLeafColor(leaf),
    zone: leaf.dataset.zone || "",
    snapped: leaf.classList.contains("snapped"),
    left: leaf.style.left,
    top: leaf.style.top,
    bottom: leaf.style.bottom,
  }));
}

function pushHistory() {
  historyStack.push(captureGameState());
  if (historyStack.length > 20) historyStack.shift();
  updateAccessibleState();
}

function applyLeafPosition(leaf, position) {
  leaf.style.left = position.left;
  leaf.style.top = position.top;
  leaf.style.bottom = position.bottom;
}

function restoreSnapshot(snapshot) {
  zones.forEach((zone) => {
    delete zone.dataset.leaf;
    zone.classList.remove("filled", "hover");
  });

  snapshot.forEach((state) => {
    const leaf = document.getElementById(state.id);
    if (!leaf) return;
    leaf.classList.toggle("yellow", state.color === "amarela");
    leaf.classList.toggle("purple", state.color !== "amarela");
    leaf.classList.toggle("snapped", state.snapped);
    leaf.style.left = state.left;
    leaf.style.top = state.top;
    leaf.style.bottom = state.bottom;
    delete leaf.dataset.zone;

    if (state.zone) {
      const zone = document.getElementById(state.zone);
      leaf.dataset.zone = state.zone;
      if (zone) {
        zone.dataset.leaf = leaf.id;
        zone.classList.add("filled");
      }
    }
  });

  clearSelection();
  checkSuccess();
}

function undoLastAction() {
  const snapshot = historyStack.pop();
  if (!snapshot) return;
  restoreSnapshot(snapshot);
  updateAccessibleState();
}

function setMouseMode(mode, options = {}) {
  if (options.manual) manualMode = true;

  document.body.dataset.mouseMode = mode;
  instructionSets.forEach((instructions) => {
    instructions.hidden = instructions.dataset.mouseInstructions !== mode;
  });
  if (touchControls) touchControls.hidden = mode !== "touch";

  resetGame({ clearHistory: true, clearInlinePositions: true });
  requestAnimationFrame(() => {
    captureInitialPositions();
    adjustGameScale();
  });

  if (options.moveFocus) {
    const heading = document.querySelector(".header-panel h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }
}

function getScale() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--game-scale")) || 1;
}

function startDrag(event) {
  if (successMessage?.style.display === "block") return;

  draggedLeaf = event.currentTarget;
  selectLeaf(draggedLeaf);
  draggedLeaf.classList.add("dragging");
  try {
    draggedLeaf.setPointerCapture?.(event.pointerId);
  } catch {
    // O arraste continua pelo documento quando a captura não é oferecida.
  }

  const scale = getScale();
  const leafRect = draggedLeaf.getBoundingClientRect();
  offsetX = (event.clientX - leafRect.left) / scale;
  offsetY = (event.clientY - leafRect.top) / scale;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  hasDragged = false;

  document.addEventListener("pointermove", dragLeaf);
  document.addEventListener("pointerup", endDrag, { once: true });
  document.addEventListener("pointercancel", cancelDrag, { once: true });
}

function dragLeaf(event) {
  if (!draggedLeaf || !board) return;

  const movedDistance = Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY);
  if (!hasDragged && movedDistance < 5) return;

  if (!hasDragged) {
    pushHistory();
    hasDragged = true;
    draggedLeaf.classList.remove("snapped");
    clearLeafZone(draggedLeaf);
    draggedLeaf.style.bottom = "auto";
  }

  const scale = getScale();
  const boardRect = board.getBoundingClientRect();
  const maxX = board.offsetWidth - draggedLeaf.offsetWidth;
  const maxY = board.offsetHeight - draggedLeaf.offsetHeight;
  const x = (event.clientX - boardRect.left) / scale - offsetX;
  const y = (event.clientY - boardRect.top) / scale - offsetY;

  draggedLeaf.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
  draggedLeaf.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
  draggedLeaf.style.zIndex = "50";
  highlightClosestZone(draggedLeaf);
}

function cancelDrag() {
  zones.forEach((zone) => zone.classList.remove("hover"));
  if (draggedLeaf) {
    draggedLeaf.classList.remove("dragging");
    draggedLeaf.style.zIndex = "10";
  }
  draggedLeaf = null;
  hasDragged = false;
  document.removeEventListener("pointermove", dragLeaf);
  document.removeEventListener("pointerup", endDrag);
}

function endDrag() {
  if (!draggedLeaf || !board) return;

  const leaf = draggedLeaf;
  const targetZone = hasDragged ? getClosestZone(leaf) : null;
  zones.forEach((zone) => zone.classList.remove("hover"));

  if (targetZone && !targetZone.dataset.leaf) {
    placeLeafInZone(leaf, targetZone);
  }

  leaf.classList.remove("dragging");
  leaf.style.zIndex = "10";
  draggedLeaf = null;
  hasDragged = false;
  document.removeEventListener("pointermove", dragLeaf);
  document.removeEventListener("pointercancel", cancelDrag);
  checkSuccess();
  updateAccessibleState();
}

function placeLeafInZone(leaf, zone, options = {}) {
  if (!leaf || !zone || zone.dataset.leaf) return;
  if (options.recordHistory) pushHistory();

  clearLeafZone(leaf);
  alignLeafWithZone(leaf, zone);
  leaf.classList.add("snapped");
  leaf.dataset.zone = zone.id;
  zone.dataset.leaf = leaf.id;
  zone.classList.add("filled");
  selectLeaf(leaf);
  checkSuccess();
}

function alignLeafWithZone(leaf, zone) {
  const zoneRect = zone.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  const scale = getScale();

  leaf.style.left = `${(zoneRect.left - boardRect.left) / scale}px`;
  leaf.style.top = `${(zoneRect.top - boardRect.top) / scale}px`;
  leaf.style.bottom = "auto";
}

function getClosestZone(leaf) {
  const leafRect = leaf.getBoundingClientRect();
  const leafCenterX = leafRect.left + leafRect.width / 2;
  const leafCenterY = leafRect.top + leafRect.height / 2;
  let closest = null;
  let closestDistance = Infinity;

  zones.forEach((zone) => {
    if (zone.dataset.leaf && zone.dataset.leaf !== leaf.id) return;

    const zoneRect = zone.getBoundingClientRect();
    const zoneCenterX = zoneRect.left + zoneRect.width / 2;
    const zoneCenterY = zoneRect.top + zoneRect.height / 2;
    const distance = Math.hypot(leafCenterX - zoneCenterX, leafCenterY - zoneCenterY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closest = zone;
    }
  });

  const targetSize = closest?.getBoundingClientRect().width || 60;
  return closestDistance < Math.max(55, targetSize * 1.2) ? closest : null;
}

function highlightClosestZone(leaf) {
  zones.forEach((zone) => zone.classList.remove("hover"));
  getClosestZone(leaf)?.classList.add("hover");
}

function changeLeafColor(leaf, options = {}) {
  if (!leaf) return;
  if (options.recordHistory) pushHistory();
  leaf.classList.toggle("purple");
  leaf.classList.toggle("yellow");
  selectLeaf(leaf);
}

function toggleLeafColor(event) {
  event.preventDefault();
  if (currentMode() !== "desktop") return;
  changeLeafColor(event.currentTarget, { recordHistory: true });
}

function restoreLeafToStart(leaf, options = {}) {
  const position = initialPositions.get(leaf?.id);
  if (!leaf || !position) return;
  if (options.recordHistory) pushHistory();

  clearLeafZone(leaf);
  leaf.classList.remove("snapped");
  applyLeafPosition(leaf, position);
  if (successMessage) successMessage.style.display = "none";
  selectLeaf(leaf);
  updateAccessibleState();
}

function returnLeaf(event) {
  if (currentMode() !== "desktop") return;
  event.preventDefault();
  restoreLeafToStart(event.currentTarget, { recordHistory: true });
}

function checkSuccess() {
  const complete = leaves.every((leaf) => leaf.classList.contains("snapped"));
  if (successMessage) successMessage.style.display = complete ? "block" : "none";
  if (complete) clearSelection();
}

function resetGame(options = {}) {
  if (successMessage) successMessage.style.display = "none";
  if (options.clearHistory !== false) historyStack.length = 0;

  zones.forEach((zone) => {
    delete zone.dataset.leaf;
    zone.classList.remove("filled", "hover");
  });

  leaves.forEach((leaf) => {
    delete leaf.dataset.zone;
    leaf.classList.remove("snapped", "selected");
    leaf.style.zIndex = "10";

    if (options.clearInlinePositions) {
      leaf.style.removeProperty("left");
      leaf.style.removeProperty("top");
      leaf.style.removeProperty("bottom");
    } else {
      const position = initialPositions.get(leaf.id);
      if (position) applyLeafPosition(leaf, position);
    }
  });

  selectedLeaf = null;
  updateAccessibleState();
}

function adjustGameScale() {
  if (!board) return;

  const scaleArea = document.querySelector(".game-scale-area");
  if (currentMode() === "touch") {
    document.documentElement.style.setProperty("--game-scale", 1);
    if (scaleArea) scaleArea.style.height = "auto";
    return;
  }

  document.documentElement.style.setProperty("--game-scale", 1);
  const availableWidth = Math.max(240, window.innerWidth - 40);
  const scaleByWidth = availableWidth / board.offsetWidth;
  const scale = Math.max(0.65, Math.min(1, scaleByWidth));

  document.documentElement.style.setProperty("--game-scale", scale);
  if (scaleArea) scaleArea.style.height = `${board.offsetHeight * scale}px`;
}

function syncLeafLayoutAfterWidthChange() {
  const snappedLeaves = leaves
    .map((leaf) => ({ leaf, zone: leaf.dataset.zone ? document.getElementById(leaf.dataset.zone) : null }))
    .filter(({ zone }) => zone);

  leaves.forEach((leaf) => {
    leaf.style.removeProperty("left");
    leaf.style.removeProperty("top");
    leaf.style.removeProperty("bottom");
  });

  captureInitialPositions();
  snappedLeaves.forEach(({ leaf, zone }) => alignLeafWithZone(leaf, zone));
  historyStack.length = 0;
  updateAccessibleState();
}

function handleResize() {
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    const widthChanged = Math.abs(window.innerWidth - lastViewportWidth) > 2;
    lastViewportWidth = window.innerWidth;
    const nextMode = recommendedMode();
    if (!manualMode && nextMode !== currentMode()) {
      setMouseMode(nextMode);
      return;
    }
    adjustGameScale();
    if (widthChanged) syncLeafLayoutAfterWidthChange();
  });
}

leaves.forEach((leaf) => {
  leaf.addEventListener("pointerdown", startDrag);
  leaf.addEventListener("click", () => selectLeaf(leaf));
  leaf.addEventListener("contextmenu", toggleLeafColor);
  leaf.addEventListener("wheel", returnLeaf, { passive: false });
});

zones.forEach((zone) => {
  zone.addEventListener("click", () => {
    if (!selectedLeaf || zone.dataset.leaf) return;
    placeLeafInZone(selectedLeaf, zone, { recordHistory: true });
  });
});

colorButton?.addEventListener("click", () => changeLeafColor(selectedLeaf, { recordHistory: true }));
returnButton?.addEventListener("click", () => restoreLeafToStart(selectedLeaf, { recordHistory: true }));
undoButton?.addEventListener("click", undoLastAction);
touchResetButton?.addEventListener("click", () => resetGame({ clearHistory: true }));
retryButton?.addEventListener("click", () => resetGame({ clearHistory: true }));
window.addEventListener("resize", handleResize);
if (window.UnapiDeviceChoice) {
  window.UnapiDeviceChoice.init({ recommendedMode, applyMode: setMouseMode });
} else {
  setMouseMode(recommendedMode());
}
