const board = document.getElementById("game-board");
const leaves = [...document.querySelectorAll(".leaf")];
const zones = [...document.querySelectorAll(".drop-zone")];
const successMessage = document.getElementById("success-message");
const retryButton = document.getElementById("btn-retry");
const initialPositions = new Map();
let draggedLeaf = null;
let offsetX = 0;
let offsetY = 0;

leaves.forEach((leaf) => {
  initialPositions.set(leaf.id, {
    left: leaf.style.left || getComputedStyle(leaf).left,
    top: leaf.style.top || getComputedStyle(leaf).top,
  });

  leaf.addEventListener("pointerdown", startDrag);
  leaf.addEventListener("contextmenu", toggleLeafColor);
  leaf.addEventListener("wheel", returnLeaf, { passive: false });
});

retryButton?.addEventListener("click", resetGame);
window.addEventListener("resize", adjustGameScale);
window.addEventListener("load", adjustGameScale);

function getScale() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--game-scale")) || 1;
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

function startDrag(event) {
  if (successMessage?.style.display === "block") return;

  draggedLeaf = event.currentTarget;
  draggedLeaf.setPointerCapture(event.pointerId);
  draggedLeaf.classList.remove("snapped");
  clearLeafZone(draggedLeaf);

  const scale = getScale();
  const leafRect = draggedLeaf.getBoundingClientRect();
  offsetX = (event.clientX - leafRect.left) / scale;
  offsetY = (event.clientY - leafRect.top) / scale;
  draggedLeaf.style.zIndex = "50";

  document.addEventListener("pointermove", dragLeaf);
  document.addEventListener("pointerup", endDrag, { once: true });
}

function dragLeaf(event) {
  if (!draggedLeaf || !board) return;

  const scale = getScale();
  const boardRect = board.getBoundingClientRect();
  const x = (event.clientX - boardRect.left) / scale - offsetX;
  const y = (event.clientY - boardRect.top) / scale - offsetY;

  draggedLeaf.style.left = `${Math.max(0, Math.min(1040, x))}px`;
  draggedLeaf.style.top = `${Math.max(0, Math.min(640, y))}px`;
  highlightClosestZone(draggedLeaf);
}

function endDrag() {
  if (!draggedLeaf || !board) return;

  const targetZone = getClosestZone(draggedLeaf);
  zones.forEach((zone) => zone.classList.remove("hover"));

  if (targetZone && !targetZone.dataset.leaf) {
    const zoneRect = targetZone.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const scale = getScale();

    draggedLeaf.style.left = `${(zoneRect.left - boardRect.left) / scale}px`;
    draggedLeaf.style.top = `${(zoneRect.top - boardRect.top) / scale}px`;
    draggedLeaf.classList.add("snapped");
    draggedLeaf.dataset.zone = targetZone.id;
    targetZone.dataset.leaf = draggedLeaf.id;
    targetZone.classList.add("filled");
  }

  draggedLeaf.style.zIndex = "10";
  draggedLeaf = null;
  document.removeEventListener("pointermove", dragLeaf);
  checkSuccess();
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

  return closestDistance < 55 ? closest : null;
}

function highlightClosestZone(leaf) {
  zones.forEach((zone) => zone.classList.remove("hover"));
  const closest = getClosestZone(leaf);
  if (closest) closest.classList.add("hover");
}

function toggleLeafColor(event) {
  event.preventDefault();
  const leaf = event.currentTarget;
  leaf.classList.toggle("purple");
  leaf.classList.toggle("yellow");
}

function returnLeaf(event) {
  event.preventDefault();

  const leaf = event.currentTarget;
  const position = initialPositions.get(leaf.id);
  if (!position) return;

  clearLeafZone(leaf);
  leaf.classList.remove("snapped");
  leaf.style.left = position.left;
  leaf.style.top = position.top;

  if (successMessage) {
    successMessage.style.display = "none";
  }
}

function checkSuccess() {
  const snappedCount = leaves.filter((leaf) => leaf.classList.contains("snapped")).length;
  if (successMessage && snappedCount === leaves.length) {
    successMessage.style.display = "block";
  }
}

function resetGame() {
  if (successMessage) {
    successMessage.style.display = "none";
  }

  zones.forEach((zone) => {
    delete zone.dataset.leaf;
    zone.classList.remove("filled", "hover");
  });

  leaves.forEach((leaf) => {
    const position = initialPositions.get(leaf.id);
    delete leaf.dataset.zone;
    leaf.classList.remove("snapped");
    leaf.style.left = position.left;
    leaf.style.top = position.top;
    leaf.style.zIndex = "10";
  });
}

function adjustGameScale() {
  if (!board) return;

  document.documentElement.style.setProperty("--game-scale", 1);
  const scaleArea = document.querySelector(".game-scale-area");
  const footer = document.querySelector(".logos-footer");
  const boardTop = board.getBoundingClientRect().top;
  const footerHeight = footer ? footer.offsetHeight : 0;
  const availableWidth = Math.max(240, window.innerWidth - 40);
  const availableHeight = Math.max(300, window.innerHeight - boardTop - footerHeight - 48);
  const scaleByWidth = availableWidth / board.offsetWidth;
  const scaleByHeight = availableHeight / board.offsetHeight;
  const scale = Math.max(0.22, Math.min(1, scaleByWidth, scaleByHeight));

  document.documentElement.style.setProperty("--game-scale", scale);
  if (scaleArea) {
    scaleArea.style.height = `${board.offsetHeight * scale}px`;
  }
}
