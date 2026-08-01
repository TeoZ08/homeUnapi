const inputField = document.getElementById("practice-input");
const keyboardContainer = document.getElementById("keyboard-container");
const keyElements = [...document.querySelectorAll(".key")];
const keyMap = new Map(keyElements.map((key) => [key.dataset.key, key]));
const browserShortcutKeys = ["Tab", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];

function ajustarEscalaTeclado() {
  const boardElement = document.getElementById("keyboard-container");
  const scaleArea = document.querySelector(".keyboard-scale-area");
  const controlsWrapper = document.getElementById("controls-wrapper");
  const footer = document.querySelector(".logos-footer");
  if (!boardElement || !scaleArea) return;

  document.documentElement.style.setProperty("--keyboard-scale", 1);
  scaleArea.style.height = "auto";

  const availableWidth = Math.max(240, window.innerWidth - 40);
  const footerHeight = footer ? footer.offsetHeight : 0;
  const controlsHeight = controlsWrapper ? controlsWrapper.offsetHeight : 0;
  const boardTop = boardElement.getBoundingClientRect().top;
  const availableHeight = Math.max(260, window.innerHeight - boardTop - controlsHeight - footerHeight - 56);
  const scaleByWidth = availableWidth / boardElement.offsetWidth;
  const scaleByHeight = availableHeight / boardElement.offsetHeight;
  const scale = Math.max(0.22, Math.min(1, scaleByWidth, scaleByHeight));

  document.documentElement.style.setProperty("--keyboard-scale", scale);
  scaleArea.style.height = `${boardElement.offsetHeight * scale}px`;
}

function activateKey(code) {
  const key = keyMap.get(code);
  if (!key) return;
  key.classList.add("active");
}

function deactivateKey(code) {
  const key = keyMap.get(code);
  if (!key) return;
  key.classList.remove("active");
}

function highlightFamily(family) {
  keyboardContainer.classList.add("mode-families-active");
  keyElements.forEach((key) => {
    key.classList.toggle("highlight-active", key.dataset.family === family);
  });
}

function resetHighlights() {
  keyboardContainer.classList.remove("mode-families-active");
  keyElements.forEach((key) => key.classList.remove("highlight-active"));
}

document.addEventListener("keydown", (event) => {
  if (browserShortcutKeys.includes(event.key)) {
    event.preventDefault();
  }

  activateKey(event.code);
  if (event.code === "CapsLock") {
    keyMap.get("CapsLock")?.classList.toggle("caps-on");
  }
});

document.addEventListener("keyup", (event) => deactivateKey(event.code));

keyElements.forEach((key) => {
  key.addEventListener("mousedown", () => key.classList.add("active"));
  key.addEventListener("mouseup", () => key.classList.remove("active"));
  key.addEventListener("mouseleave", () => key.classList.remove("active"));
});

document.getElementById("btn-fullscreen")?.addEventListener("click", () => {
  const element = document.documentElement;
  if (!document.fullscreenElement) element.requestFullscreen?.();
});

document.getElementById("toggle-families")?.addEventListener("click", () => {
  document.getElementById("family-menu")?.classList.toggle("hidden");
  keyboardContainer.classList.toggle("mode-families-active");
});

document.querySelectorAll("[data-family-button]").forEach((button) => {
  button.addEventListener("click", () => highlightFamily(button.dataset.familyButton));
});

document.getElementById("clear-highlights")?.addEventListener("click", resetHighlights);

window.addEventListener("resize", ajustarEscalaTeclado);
window.addEventListener("load", () => {
  inputField?.focus();
  ajustarEscalaTeclado();
});
