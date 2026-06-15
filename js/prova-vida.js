function appLogo() {
  return `
    <span class="app-logo" aria-label="gov.br">
      <span class="blue">g</span><span class="yellow">o</span><span class="green">v</span><span class="blue">.br</span>
    </span>
  `;
}

function trainingBar() {
  return '<div class="app-training-bar">Ambiente de treinamento — não use dados reais.</div>';
}

function appHeader() {
  return `
    <header class="app-header">
      ${appLogo()}
      <span class="simulation-chip">Simulação</span>
      <span class="app-profile" aria-hidden="true"></span>
    </header>
  `;
}

function titleBar(title) {
  return `
    <div class="app-titlebar">
      <span class="app-back" aria-hidden="true">‹</span>
      <strong>${title}</strong>
    </div>
  `;
}

function bottomNavigation(active = "inicio") {
  const items = [
    { id: "inicio", icon: "⌂", label: "Início" },
    { id: "dados", icon: "▤", label: "Dados" },
    { id: "qr", icon: "▦", label: "QR Code", extraClass: "qr" },
    { id: "carteira", icon: "▰", label: "Carteira" },
    { id: "menu", icon: "≡", label: "Menu" },
  ];

  return `
    <nav class="app-bottom-nav" aria-label="Navegação ilustrativa do aplicativo">
      ${items
        .map(
          (item) => `
            <span class="app-bottom-item ${item.extraClass || ""} ${item.id === active ? "active" : ""}">
              <span aria-hidden="true">${item.icon}</span>
              <span>${item.label}</span>
            </span>
          `
        )
        .join("")}
    </nav>
  `;
}

function historyScreen(status = "pendente", includeCompletionMark = false) {
  const completed = status === "concluída";
  return `
    <article class="app-view">
      ${trainingBar()}
      ${appHeader()}
      ${titleBar("Prova de Vida")}
      <div class="app-content">
        <h2 class="screen-heading">Histórico de Prova de Vida</h2>
        <section class="history-card" aria-label="Prova de vida ${status}">
          <span class="history-date">10 de março de 2026 · 14:30</span>
          <h3>Órgão pagador de exemplo</h3>
          <p class="history-status">Prova de vida ${status}</p>
          <span class="history-arrow" aria-hidden="true">›</span>
        </section>
        ${
          includeCompletionMark
            ? '<div class="completion-mark" aria-label="Procedimento concluído">✓</div>'
            : ""
        }
      </div>
      ${bottomNavigation()}
    </article>
  `;
}

const steps = [
  {
    title: "Antes de começar",
    explanation:
      "Este treinamento mostra o caminho geral da Prova de Vida digital. Nada digitado ou capturado é necessário nesta página.",
    tip: "<strong>Regra principal</strong>Não informe CPF, senha, código de segurança, dados bancários ou fotos durante a simulação.",
    screen: `
      <article class="app-view welcome-view">
        ${trainingBar()}
        <div class="welcome-content">
          <span class="simulation-chip">Treinamento seguro</span>
          <div class="welcome-shield" aria-hidden="true">✓</div>
          <h2>Prova de Vida digital</h2>
          <p>Conheça as telas antes de usar o aplicativo oficial.</p>
          <ul class="do-not-list">
            <li>Não digite CPF ou senha.</li>
            <li>Não informe código de mensagem.</li>
            <li>Nenhuma câmera será aberta.</li>
          </ul>
          <button type="button" class="app-button" data-action="next">Começar simulação</button>
        </div>
      </article>
    `,
  },
  {
    title: "Encontre Prova de Vida em Serviços",
    explanation:
      "No aplicativo gov.br, procure a área Serviços. O item Prova de vida aparece na lista quando há uma opção disponível para sua conta.",
    tip: "<strong>Observe o destaque amarelo</strong>Na oficina, ele indica exatamente onde tocar. O aplicativo real pode mudar um pouco de aparência.",
    screen: `
      <article class="app-view">
        ${trainingBar()}
        ${appHeader()}
        <div class="account-banner">
          <small>SUA CONTA É NÍVEL PRATA</small>
          <div class="account-level"></div>
        </div>
        <div class="app-content">
          <div class="service-search">
            <span>Encontre serviços do Governo do Brasil</span>
            <strong aria-hidden="true">⌕</strong>
          </div>
          <section class="service-list" aria-label="Serviços ilustrativos">
            <h3>Serviços</h3>
            <div class="service-item">
              <span class="service-icon" aria-hidden="true">⌕</span>
              <span>Buscar serviços</span>
              <span aria-hidden="true">›</span>
            </div>
            <div class="service-item">
              <span class="service-icon" aria-hidden="true">▰</span>
              <span>Carteira de documentos</span>
              <span aria-hidden="true">›</span>
            </div>
            <div class="service-item">
              <span class="service-icon" aria-hidden="true">✓</span>
              <span>Assinar documentos</span>
              <span aria-hidden="true">›</span>
            </div>
            <div class="service-item">
              <span class="service-icon" aria-hidden="true">↓</span>
              <span>Baixar certidões</span>
              <span aria-hidden="true">›</span>
            </div>
            <div class="service-item highlight">
              <span class="service-icon" aria-hidden="true">●</span>
              <span>Prova de vida</span>
              <span class="pending-badge" aria-label="Uma pendência">!</span>
            </div>
          </section>
        </div>
        ${bottomNavigation("inicio")}
      </article>
    `,
  },
  {
    title: "Abra a prova pendente",
    explanation:
      "O histórico mostra solicitações anteriores e pendentes. Toque apenas na solicitação que você reconhece.",
    tip: "<strong>Nem toda pessoa verá uma pendência</strong>Ela aparece quando o órgão que paga o benefício solicita ou disponibiliza o procedimento.",
    screen: historyScreen("pendente"),
  },
  {
    title: "Leia antes de autorizar",
    explanation:
      "Confira qual órgão fez o pedido, quais dados serão usados e o motivo da solicitação. Só prossiga quando as informações fizerem sentido.",
    tip: "<strong>Faça sem pressa</strong>Na vida real, pare e peça orientação se o nome do órgão ou o motivo parecer desconhecido.",
    screen: `
      <article class="app-view">
        ${trainingBar()}
        ${appHeader()}
        ${titleBar("Prova de Vida")}
        <div class="app-content">
          <div class="status-row">
            <h2 class="screen-heading">Autorização</h2>
            <span class="status-pill">Pendente</span>
          </div>
          <section class="authorization-card">
            <h3>Órgão pagador de exemplo solicita sua autorização</h3>
            <dl class="authorization-list">
              <div>
                <dt>Data da solicitação</dt>
                <dd>10 de março de 2026 · 14:30</dd>
              </div>
              <div>
                <dt>Dados acessados</dt>
                <dd>Autorização com reconhecimento facial</dd>
              </div>
              <div>
                <dt>Motivo</dt>
                <dd>Prova de vida para continuar recebendo benefício</dd>
              </div>
            </dl>
          </section>
          <div class="authorization-actions">
            <button type="button" class="app-button" data-action="next">Autorizar</button>
            <button type="button" class="app-button outline" data-action="previous">Não autorizo</button>
          </div>
        </div>
        ${bottomNavigation()}
      </article>
    `,
  },
  {
    title: "Prepare o ambiente",
    explanation:
      "O reconhecimento funciona melhor com boa iluminação e o celular firme. Retire objetos que escondam o rosto.",
    tip: "<strong>O celular deve ficar na altura do rosto</strong>Segure com as duas mãos ou peça ajuda apenas para posicionar o aparelho.",
    screen: `
      <article class="app-view tips-view">
        ${trainingBar()}
        ${titleBar("Dicas para reconhecimento facial")}
        <div class="app-content">
          <h2 class="tips-title">Antes de começar</h2>
          <ul class="face-tips">
            <li><span class="tip-icon" aria-hidden="true">☀</span><span>Esteja em ambiente iluminado.</span></li>
            <li><span class="tip-icon" aria-hidden="true">●</span><span>Deixe o rosto bem visível.</span></li>
            <li><span class="tip-icon" aria-hidden="true">▯</span><span>Segure o celular na altura do rosto.</span></li>
            <li><span class="tip-icon" aria-hidden="true">◎</span><span>Mantenha a cabeça dentro da moldura.</span></li>
          </ul>
          <button type="button" class="app-button" data-action="next">Fazer reconhecimento facial</button>
        </div>
      </article>
    `,
  },
  {
    title: "Posicione o rosto na moldura",
    explanation:
      "Na tela oficial, siga as orientações e mantenha a cabeça dentro da área indicada. Aqui usamos apenas uma silhueta ilustrativa.",
    tip: "<strong>Nenhuma câmera está ativa</strong>O movimento da linha é apenas uma animação visual para o treinamento.",
    screen: `
      <article class="app-view face-view">
        ${trainingBar()}
        ${titleBar("Reconhecimento facial")}
        <div class="face-content">
          <div class="face-oval" aria-label="Moldura ilustrativa para o rosto">
            <span class="face-silhouette" aria-hidden="true"></span>
            <span class="scan-line" aria-hidden="true"></span>
          </div>
          <h3>Posicione seu rosto dentro da moldura</h3>
          <p>Esta é apenas uma simulação.</p>
          <button type="button" class="app-button" data-action="next">Simular reconhecimento</button>
        </div>
      </article>
    `,
  },
  {
    title: "Confirme o sucesso",
    explanation:
      "Depois do reconhecimento, o aplicativo informa se a etapa foi concluída. Toque em Ok para voltar ao histórico.",
    tip: "<strong>Leia a mensagem inteira</strong>Uma tela de sucesso deve indicar claramente qual procedimento foi realizado.",
    screen: `
      <article class="app-view success-background">
        ${trainingBar()}
        ${appHeader()}
        ${titleBar("Prova de Vida")}
        <div class="app-content">
          <h2 class="screen-heading">Histórico de Prova de Vida</h2>
          <section class="history-card">
            <span class="history-date">10 de março de 2026 · 14:30</span>
            <h3>Órgão pagador de exemplo</h3>
            <p class="history-status">Processando resultado</p>
            <span class="history-arrow" aria-hidden="true">›</span>
          </section>
        </div>
        ${bottomNavigation()}
        <section class="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div class="success-modal-mark" aria-hidden="true">✓</div>
          <h3 id="success-title">Reconhecimento facial realizado com sucesso!</h3>
          <p>Sua Prova de Vida foi autorizada no ambiente de treinamento.</p>
          <button type="button" class="app-button" data-action="next">Ok</button>
        </section>
      </article>
    `,
  },
  {
    title: "Confira o status concluído",
    explanation:
      "Ao final, o histórico deve mostrar a Prova de Vida como concluída ou autorizada. Essa confirmação encerra o fluxo no aplicativo.",
    tip: "<strong>Acompanhe pelos canais oficiais</strong>Na vida real, confira também o órgão pagador ou o canal indicado para o seu benefício.",
    screen: historyScreen("concluída", true),
  },
  {
    title: "Leve estas regras com você",
    explanation:
      "Segurança faz parte da Prova de Vida. Use somente o aplicativo gov.br e os canais oficiais do órgão responsável.",
    tip: "<strong>O instrutor orienta; o dono da conta digita</strong>Nunca entregue sua senha ou seu código de segurança para outra pessoa.",
    screen: `
      <article class="app-view security-view">
        ${trainingBar()}
        <span class="simulation-chip">Fim do treinamento</span>
        <h2>Proteja sua conta</h2>
        <p>Antes de sair, relembre estas regras:</p>
        <ul class="security-list">
          <li>Não compartilhe sua senha gov.br.</li>
          <li>Não fale código de mensagem em voz alta.</li>
          <li>Não envie foto de documento por WhatsApp.</li>
          <li>Não clique em links recebidos por mensagem.</li>
          <li>Use apenas o app gov.br e canais oficiais.</li>
        </ul>
        <p class="owner-reminder">O instrutor orienta. Quem digita é o dono da conta.</p>
        <button type="button" class="app-button success" data-action="restart">Rever treinamento</button>
      </article>
    `,
  },
];

let currentStep = 0;

const screenElement = document.getElementById("proof-screen");
const titleElement = document.getElementById("step-title");
const explanationElement = document.getElementById("step-explanation");
const tipElement = document.getElementById("step-tip");
const counterElement = document.getElementById("step-counter");
const progressElement = document.getElementById("step-progress");
const previousButton = document.getElementById("prev-step");
const nextButton = document.getElementById("next-step");

function renderStep({ focusHeading = false } = {}) {
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  screenElement.innerHTML = step.screen;
  titleElement.textContent = step.title;
  explanationElement.textContent = step.explanation;
  tipElement.innerHTML = step.tip;
  counterElement.textContent = `Etapa ${currentStep + 1} de ${steps.length}`;
  progressElement.style.setProperty("--progress", `${progress}%`);
  progressElement.setAttribute("aria-valuenow", String(currentStep + 1));
  progressElement.setAttribute(
    "aria-valuetext",
    `Etapa ${currentStep + 1} de ${steps.length}`
  );
  previousButton.disabled = currentStep === 0;
  nextButton.textContent = currentStep === steps.length - 1 ? "Reiniciar" : "Próximo";

  if (focusHeading) {
    titleElement.setAttribute("tabindex", "-1");
    titleElement.focus({ preventScroll: true });
  }
}

function setStep(stepIndex, options = {}) {
  currentStep = Math.max(0, Math.min(steps.length - 1, stepIndex));
  renderStep(options);
}

function goToPreviousStep() {
  if (currentStep > 0) {
    setStep(currentStep - 1, { focusHeading: true });
  }
}

function goToNextStep() {
  if (currentStep === steps.length - 1) {
    setStep(0, { focusHeading: true });
    return;
  }

  setStep(currentStep + 1, { focusHeading: true });
}

function handleScreenAction(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;

  if (action === "next") goToNextStep();
  if (action === "previous") goToPreviousStep();
  if (action === "restart") setStep(0, { focusHeading: true });
}

previousButton.addEventListener("click", goToPreviousStep);
nextButton.addEventListener("click", goToNextStep);
screenElement.addEventListener("click", handleScreenAction);

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    goToNextStep();
  }

  if (event.key === "ArrowLeft") {
    goToPreviousStep();
  }
});

renderStep();
