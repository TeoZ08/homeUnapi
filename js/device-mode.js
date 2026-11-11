(() => {
  const storageKey = "unapi-device-mode";
  const validModes = new Set(["touch", "desktop"]);

  function readStoredMode() {
    try {
      const value = window.sessionStorage.getItem(storageKey);
      return validModes.has(value) ? value : null;
    } catch {
      return null;
    }
  }

  function storeMode(mode) {
    try {
      window.sessionStorage.setItem(storageKey, mode);
    } catch {
      // A escolha ainda funciona quando o navegador bloqueia armazenamento.
    }
  }

  function init(options) {
    const gate = document.querySelector("[data-device-gate]");
    const dialog = gate?.querySelector("[role='dialog']");
    const choiceButtons = [...(gate?.querySelectorAll("[data-device-choice]") || [])];
    const changeButton = document.querySelector("[data-device-change]");
    const currentLabel = document.querySelector("[data-device-current]");
    if (!gate || !dialog || choiceButtons.length !== 2 || typeof options?.applyMode !== "function") return;

    const backgroundElements = [...document.body.children].filter(
      (element) => element !== gate && element.tagName !== "SCRIPT",
    );
    let activeMode = null;

    function recommendedMode() {
      const mode = options.recommendedMode?.();
      return validModes.has(mode) ? mode : "touch";
    }

    function updateGateState() {
      const recommendation = recommendedMode();
      choiceButtons.forEach((button) => {
        const mode = button.dataset.deviceChoice;
        const isRecommended = mode === recommendation;
        const isSelected = mode === activeMode;
        button.classList.toggle("is-recommended", isRecommended);
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));

        const recommendationBadge = button.querySelector("[data-device-recommendation]");
        const selectedBadge = button.querySelector("[data-device-selected]");
        if (recommendationBadge) recommendationBadge.hidden = !isRecommended || isSelected;
        if (selectedBadge) {
          selectedBadge.hidden = !isSelected;
          selectedBadge.textContent = isRecommended ? "✓ Selecionado · recomendado" : "✓ Selecionado";
        }
      });

      if (currentLabel) {
        const visibleMode = activeMode || recommendation;
        currentLabel.textContent = visibleMode === "desktop" ? "computador" : "celular";
      }
    }

    function setBackgroundInert(value) {
      backgroundElements.forEach((element) => {
        element.inert = value;
      });
    }

    function openGate() {
      updateGateState();
      gate.hidden = false;
      document.body.classList.add("device-gate-open");
      setBackgroundInert(true);
      requestAnimationFrame(() => dialog.focus({ preventScroll: true }));
    }

    function closeGate() {
      gate.hidden = true;
      document.body.classList.remove("device-gate-open");
      setBackgroundInert(false);
    }

    function chooseMode(mode, moveFocus = true) {
      if (!validModes.has(mode)) return;
      activeMode = mode;
      storeMode(mode);
      closeGate();
      options.applyMode(mode, { manual: true, moveFocus });
      updateGateState();
    }

    choiceButtons.forEach((button) => {
      button.addEventListener("click", () => chooseMode(button.dataset.deviceChoice));
    });

    changeButton?.addEventListener("click", openGate);

    gate.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = choiceButtons.filter((button) => !button.disabled);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (!gate.hidden) updateGateState();
    });

    const storedMode = readStoredMode();
    const initialMode = storedMode || recommendedMode();
    activeMode = storedMode;
    options.applyMode(initialMode, { manual: Boolean(storedMode), moveFocus: false });
    updateGateState();

    if (storedMode) {
      closeGate();
    } else {
      openGate();
    }
  }

  window.UnapiDeviceChoice = { init };
})();
