const inputField = document.getElementById("practice-input");
const keyboardContainer = document.getElementById("keyboard-container");
const keyElements = [...document.querySelectorAll(".key")];
const keyMap = new Map(keyElements.map((key) => [key.dataset.key, key]));
const desktopShortcutKeys = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];
const modePanels = [...document.querySelectorAll("[data-keyboard-panel]")];
const coarsePointer = window.matchMedia("(pointer: coarse)");
const familyToggle = document.getElementById("toggle-families");
const familyMenu = document.getElementById("family-menu");
const touchInput = document.getElementById("touch-practice-input");
const touchTarget = document.getElementById("touch-target");
const touchStep = document.getElementById("touch-step");
const touchFeedback = document.getElementById("touch-feedback");
const touchProgress = document.querySelector(".touch-progress");
const touchProgressBar = document.querySelector(".touch-progress span");
const touchNext = document.getElementById("touch-next");
const touchClear = document.getElementById("touch-clear");

const touchPhrases = [
  "Bom dia!",
  "Meu nome é Ana.",
  "A internet ajuda.",
  "Eu confiro antes de clicar.",
  "Aprendi a usar o celular.",
];

let touchPhraseIndex = 0;
let manualMode = false;

function recommendedMode() {
  const phoneWidth = window.innerWidth <= 720;
  const touchLandscape = coarsePointer.matches && window.innerWidth > window.innerHeight && window.innerHeight <= 560;
  return phoneWidth || touchLandscape ? "touch" : "desktop";
}

function setKeyboardMode(mode, options = {}) {
  if (options.manual) manualMode = true;

  document.body.dataset.keyboardMode = mode;
  modePanels.forEach((panel) => {
    panel.hidden = panel.dataset.keyboardPanel !== mode;
  });

  if (mode === "desktop") {
    requestAnimationFrame(ajustarEscalaTeclado);
  }

  if (options.moveFocus) {
    const heading = mode === "touch" ? document.getElementById("touch-practice-title") : inputField;
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }
}

function ajustarEscalaTeclado() {
  const boardElement = document.getElementById("keyboard-container");
  const scaleArea = document.querySelector(".keyboard-scale-area");
  const controlsWrapper = document.getElementById("controls-wrapper");
  const footer = document.querySelector(".logos-footer");
  if (!boardElement || !scaleArea || document.body.dataset.keyboardMode !== "desktop") return;

  document.documentElement.style.setProperty("--keyboard-scale", 1);
  scaleArea.style.height = "auto";

  const availableWidth = Math.max(240, window.innerWidth - 40);
  const footerHeight = footer ? footer.offsetHeight : 0;
  const controlsHeight = controlsWrapper ? controlsWrapper.offsetHeight : 0;
  const boardTop = boardElement.getBoundingClientRect().top;
  const availableHeight = Math.max(260, window.innerHeight - boardTop - controlsHeight - footerHeight - 56);
  const scaleByWidth = availableWidth / boardElement.offsetWidth;
  const scaleByHeight = availableHeight / boardElement.offsetHeight;
  const minimumReadableScale = window.innerWidth <= 720 ? 0.55 : 0.4;
  const scale = Math.max(minimumReadableScale, Math.min(1, scaleByWidth, scaleByHeight));

  document.documentElement.style.setProperty("--keyboard-scale", scale);
  scaleArea.style.height = `${boardElement.offsetHeight * scale}px`;
}

function activateKey(code) {
  keyMap.get(code)?.classList.add("active");
}

function deactivateKey(code) {
  keyMap.get(code)?.classList.remove("active");
}

function highlightFamily(family) {
  keyboardContainer?.classList.add("mode-families-active");
  keyElements.forEach((key) => {
    key.classList.toggle("highlight-active", key.dataset.family === family);
  });
  document.querySelectorAll("[data-family-button]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.familyButton === family));
  });
}

function resetHighlights() {
  keyboardContainer?.classList.remove("mode-families-active");
  keyElements.forEach((key) => key.classList.remove("highlight-active"));
  document.querySelectorAll("[data-family-button]").forEach((button) => button.setAttribute("aria-pressed", "false"));
}

function comparableText(value) {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function updateTouchFeedback() {
  if (!touchInput || !touchFeedback || !touchNext) return;

  const typed = comparableText(touchInput.value);
  const expected = comparableText(touchPhrases[touchPhraseIndex]);
  const complete = typed === expected;
  const onTrack = expected.startsWith(typed);

  touchFeedback.classList.toggle("is-correct", complete);
  touchFeedback.classList.toggle("has-error", Boolean(typed) && !onTrack);
  touchInput.removeAttribute("aria-invalid");

  if (!typed) {
    touchFeedback.textContent = "Comece quando estiver pronto(a).";
  } else if (complete) {
    touchFeedback.textContent = "Muito bem! A frase está completa.";
  } else if (onTrack) {
    touchFeedback.textContent = "Você está no caminho certo. Continue digitando.";
  } else {
    touchFeedback.textContent = "Há uma diferença. Use a tecla apagar e tente novamente.";
    touchInput.setAttribute("aria-invalid", "true");
  }

  touchNext.disabled = !complete;
  const completedPhrases = touchPhraseIndex + (complete ? 1 : 0);
  touchProgress?.setAttribute("aria-valuenow", String(completedPhrases));
  if (touchProgressBar) {
    touchProgressBar.style.width = `${(completedPhrases / touchPhrases.length) * 100}%`;
  }
}

function renderTouchPhrase() {
  const phrase = touchPhrases[touchPhraseIndex];
  if (touchTarget) touchTarget.textContent = phrase;
  if (touchStep) touchStep.textContent = `Frase ${touchPhraseIndex + 1} de ${touchPhrases.length}`;
  if (touchInput) touchInput.value = "";
  if (touchNext) touchNext.textContent = touchPhraseIndex === touchPhrases.length - 1 ? "Praticar novamente" : "Próxima frase";
  updateTouchFeedback();
}

function advanceTouchPhrase() {
  if (touchNext?.disabled) return;
  touchPhraseIndex = touchPhraseIndex === touchPhrases.length - 1 ? 0 : touchPhraseIndex + 1;
  renderTouchPhrase();
  touchInput?.focus();
}

document.addEventListener("keydown", (event) => {
  if (document.body.dataset.keyboardMode !== "desktop") return;

  if (desktopShortcutKeys.includes(event.key) && document.activeElement === inputField) {
    event.preventDefault();
  }

  activateKey(event.code);
  if (event.code === "CapsLock") {
    keyMap.get("CapsLock")?.classList.toggle("caps-on");
  }
});

document.addEventListener("keyup", (event) => deactivateKey(event.code));

keyElements.forEach((key) => {
  key.addEventListener("pointerdown", () => key.classList.add("active"));
  key.addEventListener("pointerup", () => key.classList.remove("active"));
  key.addEventListener("pointercancel", () => key.classList.remove("active"));
  key.addEventListener("pointerleave", () => key.classList.remove("active"));
});

document.getElementById("btn-fullscreen")?.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
    } else {
      await document.documentElement.requestFullscreen?.();
    }
  } catch {
    // O navegador pode negar tela cheia sem alterar a prática principal.
  }
});

familyToggle?.addEventListener("click", () => {
  const willOpen = familyMenu?.classList.contains("hidden");
  familyMenu?.classList.toggle("hidden");
  familyToggle.setAttribute("aria-expanded", String(willOpen));
  keyboardContainer?.classList.toggle("mode-families-active", Boolean(willOpen));
});

document.querySelectorAll("[data-family-button]").forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => highlightFamily(button.dataset.familyButton));
});

document.getElementById("clear-highlights")?.addEventListener("click", resetHighlights);

touchInput?.addEventListener("input", updateTouchFeedback);
touchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !touchNext?.disabled) {
    event.preventDefault();
    advanceTouchPhrase();
  }
});
touchClear?.addEventListener("click", () => {
  if (touchInput) touchInput.value = "";
  updateTouchFeedback();
  touchInput?.focus();
});
touchNext?.addEventListener("click", advanceTouchPhrase);

window.addEventListener("resize", () => {
  if (!manualMode) setKeyboardMode(recommendedMode());
  ajustarEscalaTeclado();
});

renderTouchPhrase();
if (window.UnapiDeviceChoice) {
  window.UnapiDeviceChoice.init({ recommendedMode, applyMode: setKeyboardMode });
} else {
  setKeyboardMode(recommendedMode());
}
