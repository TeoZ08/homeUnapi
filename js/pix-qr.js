(() => {
  "use strict";

  const scriptUrl = document.currentScript?.src || window.location.href;
  const portalRoot = new URL("../", scriptUrl);
  const publishedRoot = new URL("https://pet-sistemas.github.io/unapi-oficinas/");

  const scenarios = Object.freeze({
    cantina: Object.freeze({
      id: "cantina",
      shortLabel: "Cenário A",
      title: "Dados corretos",
      tag: "Correto",
      expectedName: "Cantina UnAPI",
      expectedAmount: 12,
      shownName: "Cantina UnAPI",
      documentLabel: "CNPJ",
      document: "12.345.678/0001-90",
      shownAmount: 12,
      correctAction: "confirm",
      projectionInstruction: "Pague R$ 12,00 para Cantina UnAPI.",
      successFeedback: "Boa! Você conferiu o destinatário e o valor antes de pagar.",
    }),
    "destinatario-errado": Object.freeze({
      id: "destinatario-errado",
      shortLabel: "Cenário B",
      title: "Destinatário errado",
      tag: "Atenção",
      expectedName: "Cantina UnAPI",
      expectedAmount: 12,
      shownName: "Carlos Eduardo Pereira",
      documentLabel: "CPF",
      document: "***.942.325-**",
      shownAmount: 12,
      correctAction: "cancel",
      projectionInstruction: "Pague R$ 12,00 para Cantina UnAPI.",
      warningFeedback: "Pare. O destinatário não é quem você esperava.",
      cancelFeedback: "Boa decisão. Quando o nome não confere, não faça o Pix.",
    }),
    "valor-errado": Object.freeze({
      id: "valor-errado",
      shortLabel: "Cenário C",
      title: "Valor errado",
      tag: "Atenção",
      expectedName: "Cantina UnAPI",
      expectedAmount: 15,
      shownName: "Cantina UnAPI",
      documentLabel: "CNPJ",
      document: "12.345.678/0001-90",
      shownAmount: 150,
      correctAction: "cancel",
      projectionInstruction: "Pague R$ 15,00 para Cantina UnAPI.",
      warningFeedback: "Pare. O valor está diferente do combinado.",
      cancelFeedback: "Boa! O valor estava diferente do combinado.",
    }),
  });

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>'"]/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[character],
    );
  }

  function formatMoney(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function buildScenarioUrl(scenarioId) {
    if (!Object.hasOwn(scenarios, scenarioId)) return null;
    const url = new URL("pix/qr/", publishedRoot);
    url.searchParams.set("cenario", scenarioId);
    return url.href;
  }

  function buildReceiveUrl(cents) {
    const url = new URL("pix/qr/", publishedRoot);
    url.searchParams.set("receber", cents);
    return url.href;
  }

  function createQrSvg(scenarioId) {
    const scenario = scenarios[scenarioId];
    const url = buildScenarioUrl(scenarioId);
    if (!scenario || !url || typeof window.qrcode !== "function") return "";

    const code = window.qrcode(0, "M");
    code.addData(url);
    code.make();
    return code.createSvgTag({
      cellSize: 8,
      margin: 32,
      scalable: true,
      title: {
        id: `pix-qr-title-${scenarioId}`,
        text: `QR Code de treinamento: ${scenario.shortLabel}, ${scenario.title}`,
      },
      alt: {
        id: `pix-qr-description-${scenarioId}`,
        text: `Ao escanear, abre uma URL do Portal UnAPI para o ${scenario.shortLabel}.`,
      },
    });
  }

  function hostNotice() {
    return {
      blocked: false,
      message: `Os QR Codes apontam para ${publishedRoot.origin}${publishedRoot.pathname}. Eles não dependem do endereço deste computador.`,
    };
  }

  function setupShell({
    device,
    resetButton,
    fullscreenButton,
    onReset,
  }) {
    const tools = document.querySelector(".pix-workshop-tools");
    const toggle = tools?.querySelector(".pix-tools-toggle");
    const fullscreenLabel = fullscreenButton?.querySelector(
      "[data-fullscreen-label]",
    );

    function closeTools({ restoreFocus = false } = {}) {
      if (!tools?.classList.contains("is-open")) return;
      tools.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
      if (restoreFocus) toggle?.focus();
    }

    toggle?.addEventListener("click", () => {
      const isOpen = tools.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!tools?.classList.contains("is-open")) return;
      if (!tools.contains(event.target) || event.target.closest(".pix-tool-control")) {
        closeTools();
      }
    });

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape" || !tools?.classList.contains("is-open")) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        closeTools({ restoreFocus: true });
      },
      true,
    );

    resetButton?.addEventListener("click", () => {
      closeTools();
      onReset?.();
    });

    fullscreenButton?.addEventListener("click", async () => {
      if (!device || !document.fullscreenEnabled) return;
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        const announcement = document.querySelector(
          "[id$='announcement']",
        );
        if (announcement) {
          announcement.textContent = "Não foi possível alterar a tela cheia.";
        }
      }
    });

    document.addEventListener("fullscreenchange", () => {
      if (!fullscreenButton || !device) return;
      const isActive = Boolean(document.fullscreenElement);
      fullscreenButton.setAttribute("aria-pressed", String(isActive));
      if (fullscreenLabel) {
        fullscreenLabel.textContent = isActive
          ? "Sair da tela cheia"
          : "Abrir em tela cheia";
      }
    });
  }

  function setupEdgeSwipe(app, onBack) {
    let swipeStart = null;

    app?.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || event.clientX > 28) return;
      swipeStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
    });

    app?.addEventListener("pointerup", (event) => {
      if (!swipeStart || swipeStart.id !== event.pointerId) return;
      const deltaX = event.clientX - swipeStart.x;
      const deltaY = Math.abs(event.clientY - swipeStart.y);
      swipeStart = null;
      if (deltaX > 78 && deltaX > deltaY * 1.4) onBack?.();
    });

    app?.addEventListener("pointercancel", () => {
      swipeStart = null;
    });
  }

  window.PixQrWorkshop = Object.freeze({
    scenarios,
    escapeHtml,
    formatMoney,
    buildScenarioUrl,
    buildReceiveUrl,
    createQrSvg,
    hostNotice,
    setupShell,
    setupEdgeSwipe,
  });

})();
