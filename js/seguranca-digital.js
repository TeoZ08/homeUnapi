const challengeApp = document.getElementById("challenge-app");
const challengeAnnouncement = document.getElementById("challenge-announcement");
const completedScenarios = new Set();

let currentView = "intro";
let activeScenario = null;
let scenarioStage = "start";
let typingTimeout = null;
let emailAddressExpanded = false;
let emailLinkExpanded = false;

const scenarioData = {
  whatsapp: {
    label: "WhatsApp",
    cardTitle: "Número novo",
    summary: "Um familiar aparece com um número novo e pede dinheiro.",
    signals: [
      "número desconhecido",
      "pedido urgente",
      "pedido de dinheiro",
      "conta em nome de terceiro",
      "desculpa para não atender ligação",
      "tentativa de impedir confirmação",
    ],
    recommended:
      "Não faça o pagamento. Ligue para o número que você já conhecia ou confirme pessoalmente com outro familiar.",
  },
  email: {
    label: "E-mail",
    cardTitle: "Conta bloqueada",
    summary: "Uma mensagem diz que sua conta será bloqueada.",
    signals: [
      "ameaça de bloqueio",
      "prazo muito curto",
      "remetente com endereço estranho",
      "botão urgente",
      "link diferente do site oficial",
      "pedido de senha ou código",
    ],
    recommended:
      "Não use o botão recebido. Abra o aplicativo ou digite o endereço oficial por conta própria.",
  },
  sms: {
    label: "SMS",
    cardTitle: "Taxa de entrega",
    summary: "Uma encomenda está retida e exige uma pequena taxa.",
    signals: [
      "número desconhecido",
      "mensagem inesperada",
      "link estranho",
      "cobrança pequena",
      "prazo curto",
      "pedido de dados bancários",
    ],
    recommended:
      "Não use o link. Confira a entrega diretamente no aplicativo ou site oficial da transportadora.",
  },
};

function announce(message) {
  challengeAnnouncement.textContent = message;
}

function clearTypingTimeout() {
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function focusElement(selector = "[data-challenge-title]") {
  const element = challengeApp.querySelector(selector);
  if (!element) return;

  element.setAttribute("tabindex", "-1");
  element.focus({ preventScroll: true });
}

function render(content, announcement = "", options = {}) {
  const {
    focusSelector = "[data-challenge-title]",
    scrollSelector = "",
  } = options;

  challengeApp.innerHTML = content;
  announce(announcement);
  requestAnimationFrame(() => {
    focusElement(focusSelector);

    if (!scrollSelector) return;

    const scrollTarget = challengeApp.querySelector(scrollSelector);
    scrollTarget?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  });
}

function ruleBanner() {
  return `
    <p class="rule-line" aria-label="Regra de segurança: Pare, confira, decida">
      <strong>Pare. Confira. Decida.</strong> Confirme por um contato, aplicativo ou site oficial.
    </p>
  `;
}

function progressCard() {
  const count = completedScenarios.size;
  const completed = ["whatsapp", "email", "sms"];

  return `
    <div class="challenge-progress" aria-label="${count} de 3 desafios concluídos">
      <span>${count} de 3 desafios concluídos</span>
      <span class="progress-dots" aria-hidden="true">
        ${completed
          .map((scenario) => `<span class="${completedScenarios.has(scenario) ? "complete" : ""}"></span>`)
          .join("")}
      </span>
    </div>
  `;
}

function renderIntro() {
  clearTypingTimeout();
  currentView = "intro";
  activeScenario = null;

  render(`
    <section class="challenge-view challenge-intro">
      <span class="challenge-eyebrow">Segurança digital</span>
      <h1 class="challenge-title" data-challenge-title>Desafio Antigolpe</h1>
      <p class="challenge-lead">
        Analise mensagens suspeitas no WhatsApp, e-mail e SMS.
      </p>
      ${ruleBanner()}
      <button type="button" class="challenge-action" data-action="start">Começar desafio</button>
    </section>
  `, "Desafio Antigolpe. Regra principal: pare, confira, decida.");
}

function renderSelection() {
  clearTypingTimeout();
  currentView = "selection";
  activeScenario = null;

  const cards = [
    { id: "whatsapp", className: "whatsapp-card" },
    { id: "email", className: "email-card" },
    { id: "sms", className: "sms-card" },
  ];

  render(`
    <section class="challenge-view">
      <div class="challenge-selection-header">
        <div>
          <span class="challenge-eyebrow">Escolha uma situação</span>
          <h1 class="challenge-selection-title" data-challenge-title>Por onde você quer começar?</h1>
          <p class="challenge-selection-copy">Você pode praticar as três situações em qualquer ordem.</p>
        </div>
        ${progressCard()}
      </div>
      <div class="scenario-grid">
        ${cards
          .map(({ id, className }) => {
            const scenario = scenarioData[id];
            const completed = completedScenarios.has(id);
            return `
              <button type="button" class="scenario-card ${className} ${completed ? "completed" : ""}" data-action="start-scenario" data-scenario="${id}">
                <span class="channel-label ${id}">${scenario.label}</span>
                <div>
                  <h3>${scenario.cardTitle}</h3>
                  <p>${scenario.summary}</p>
                </div>
                ${
                  completed
                    ? '<span class="scenario-card-status">Desafio concluído</span>'
                    : '<span class="scenario-card-start">Iniciar desafio</span>'
                }
              </button>
            `;
          })
          .join("")}
      </div>
    </section>
  `, "Escolha um desafio para praticar.");
}

function scenarioLayout(channel, title, summary, content, decisionTitle, decisions, feedback = "", sideContent = "") {
  return `
    <section class="challenge-view scenario-view">
      <header class="scenario-header">
        <div>
          <span class="channel-label ${channel}">${scenarioData[channel].label}</span>
          <h1 class="scenario-heading" data-challenge-title>${title}</h1>
          <p class="scenario-summary">${summary}</p>
        </div>
        <div class="scenario-header-meta">
          ${progressCard()}
          <button type="button" class="scenario-return" data-action="back-selection">← Voltar aos desafios</button>
        </div>
      </header>
      <div class="scenario-workspace">
        <section class="scenario-content">${content}</section>
        <aside class="scenario-decision">
          ${feedback}
          ${sideContent}
          ${
            decisions.length
              ? `
                <section class="decision-panel" aria-label="Decisão do desafio">
                  <h2>${decisionTitle}</h2>
                  <div class="decision-grid">${decisions.join("")}</div>
                </section>
              `
              : ""
          }
        </aside>
      </div>
    </section>
  `;
}

function decisionButton(label, action, value = "") {
  return `<button type="button" class="decision-button" data-action="${action}" ${value ? `data-value="${value}"` : ""}>${label}</button>`;
}

function messageBubble(text, type = "incoming", time = "10:12", isNew = false) {
  return `
    <div class="message-bubble ${type}" ${isNew ? "data-new-message" : ""}>
      ${text}
      <span class="message-time">${time}</span>
    </div>
  `;
}

function renderWhatsapp() {
  const isWaiting = scenarioStage === "waiting";
  const hasRequest = !isWaiting;
  const responses = [];
  let feedback = "";
  let decisions = [];

  if (scenarioStage === "decision") {
    decisions = [
      decisionButton("Pedir a chave Pix", "whatsapp-choice", "pix"),
      decisionButton("Pedir um áudio para confirmar", "whatsapp-choice", "audio"),
      decisionButton("Ligar para o número antigo", "whatsapp-choice", "old-phone"),
      decisionButton("Confirmar com outro familiar", "whatsapp-choice", "family"),
    ];
  }

  if (scenarioStage === "pix") {
    responses.push(messageBubble("Pode mandar para esta conta. Ela está no nome de um amigo meu porque meu banco está com problema.", "incoming", "10:15", true));
    feedback = '<div class="feedback-card caution"><strong>Conta de terceiro</strong>O pedido mudou para uma conta em nome de outra pessoa.</div>';
    decisions = [
      decisionButton("Fazer o Pix para a conta indicada", "whatsapp-choice", "pay"),
      decisionButton("Encerrar a conversa e confirmar", "whatsapp-choice", "confirm"),
    ];
  }

  if (scenarioStage === "audio") {
    responses.push(messageBubble("Agora não consigo falar. O microfone deste celular está quebrado. É urgente!", "incoming", "10:15", true));
    feedback = '<div class="feedback-card caution"><strong>A urgência continua</strong>O contato evitou uma confirmação simples e manteve a pressão.</div>';
    decisions = [
      decisionButton("Fazer o Pix mesmo assim", "whatsapp-choice", "believe"),
      decisionButton("Ligar para o número antigo", "whatsapp-choice", "old-phone"),
      decisionButton("Confirmar com outro familiar", "whatsapp-choice", "family"),
    ];
  }

  const conversation = `
    <section class="whatsapp-sim" aria-label="Conversa simulada no WhatsApp">
      <header class="chat-header">
        <span class="chat-avatar" aria-hidden="true">F</span>
        <div>
          <strong>Filho — número novo</strong>
        </div>
      </header>
      <div class="chat-messages">
        ${messageBubble("Oi, mãe! Este é meu número novo. Meu celular antigo estragou. Salva esse aqui.", "incoming", "10:10")}
        ${hasRequest ? messageBubble("Estou tentando pagar uma conta, mas meu banco travou. Você consegue fazer um Pix para mim? Amanhã eu devolvo.", "incoming", "10:12") : '<div class="typing-indicator">digitando<span>...</span></div>'}
        ${responses.join("")}
      </div>
    </section>
  `;

  render(
    scenarioLayout(
      "whatsapp",
      "Mensagem de familiar ou golpe?",
      "Número novo e pedido de Pix com urgência.",
      conversation,
      scenarioStage === "decision" ? "O que você faria?" : "E agora, o que você faria?",
      decisions,
      feedback
    ),
    isWaiting ? "O contato está digitando uma nova mensagem." : "Analise a conversa antes de responder.",
    {
      focusSelector: scenarioStage === "pix" || scenarioStage === "audio" ? "[data-new-message]" : "[data-challenge-title]",
      scrollSelector: scenarioStage === "pix" || scenarioStage === "audio" ? "[data-new-message]" : "[data-challenge-title]",
    }
  );
}

function startWhatsapp() {
  scenarioStage = "waiting";
  renderWhatsapp();
  const reducedMotion = prefersReducedMotion();
  typingTimeout = window.setTimeout(() => {
    typingTimeout = null;
    if (activeScenario === "whatsapp" && scenarioStage === "waiting") {
      scenarioStage = "decision";
      renderWhatsapp();
    }
  }, reducedMotion ? 0 : 700);
}

function renderEmail(renderOptions = {}) {
  const showAddress = emailAddressExpanded;
  const showLinkAddress = emailLinkExpanded;
  const isReply = scenarioStage === "reply";
  const feedback = isReply
    ? '<div class="feedback-card caution"><strong>A pressão voltou</strong>O contato insiste no botão em vez de oferecer outro canal.</div>'
    : "";
  const decisions = isReply
    ? [
        decisionButton("Usar o botão do e-mail", "email-choice", "link"),
        decisionButton("Abrir o serviço oficial", "email-choice", "official"),
        decisionButton("Denunciar como phishing", "email-choice", "report"),
      ]
    : [
        decisionButton("Usar o botão do e-mail", "email-choice", "link"),
        decisionButton("Responder a mensagem", "email-choice", "reply"),
        decisionButton("Abrir o serviço oficial", "email-choice", "official"),
        decisionButton("Denunciar como phishing", "email-choice", "report"),
      ];

  const emailSimulation = `
    <section class="email-sim" aria-label="E-mail simulado">
      <header class="email-topbar">
        <span class="email-wordmark">Caixa de entrada</span>
      </header>
      <article class="email-message">
          <h2 class="email-subject">Sua conta será bloqueada hoje</h2>
          <div class="sender-row">
            <span class="sender-avatar" aria-hidden="true">S</span>
            <div>
              <button type="button" class="sender-toggle" data-action="email-sender" aria-expanded="${showAddress}">Segurança da Conta</button>
              <span class="sender-address ${showAddress ? "visible" : ""}">suporte-conta@google-seguranca.example</span>
            </div>
            <span class="email-date">Hoje, 10:42</span>
          </div>
          <div class="email-body">
            <p>Detectamos uma atividade suspeita em sua conta.</p>
            <p>Para evitar o bloqueio, confirme seus dados imediatamente.</p>
            <p>Você tem 30 minutos para concluir a verificação.</p>
            <button type="button" class="fake-email-link" data-action="email-choice" data-value="link">VERIFICAR CONTA</button>
            <button type="button" class="link-address-toggle" data-action="email-link-address" aria-expanded="${showLinkAddress}" aria-controls="email-link-address">
              ${showLinkAddress ? "Ocultar endereço do link" : "Ver endereço do link"}
            </button>
            <span id="email-link-address" class="link-preview ${showLinkAddress ? "visible" : ""}" aria-live="polite">Destino simulado: conta-segura.example/verificar</span>
            ${isReply ? '<p class="email-reply" data-new-message><strong>Resposta simulada:</strong> Para evitar o bloqueio, use somente o botão enviado. Não podemos confirmar por outro canal.</p>' : ""}
          </div>
        </article>
    </section>
  `;

  render(
    scenarioLayout(
      "email",
      "E-mail importante ou ameaça?",
      "O bloqueio e o prazo curto tentam apressar sua decisão.",
      emailSimulation,
      isReply ? "E agora, o que você faria?" : "O que você faria?",
      decisions,
      feedback
    ),
    "Analise o remetente, o prazo e o destino do botão antes de agir.",
    {
      focusSelector: isReply ? "[data-new-message]" : "[data-challenge-title]",
      scrollSelector: isReply ? "[data-new-message]" : "[data-challenge-title]",
      ...renderOptions,
    }
  );
}

function renderEmailFakePage() {
  const fakePage = `
    <section class="fake-site" aria-label="Página falsa simulada">
      <span class="fake-site-logo">conta segura</span>
      <h2>Confirme sua conta</h2>
      <p>A página imita uma área de segurança e tentaria recolher seus dados.</p>
      <p class="fake-data-label">Dados que a página pediria</p>
      <div class="fake-data-list" aria-label="Dados ilustrativos que uma página falsa pediria">
        <span>Senha</span>
        <span>Telefone</span>
        <span>Código de segurança</span>
      </div>
      <div class="interruption-overlay" data-risk-alert>
        <strong>Cuidado: esta página é falsa.</strong>
        Ela tentaria obter sua senha e seus dados.
      </div>
    </section>
  `;

  render(
    scenarioLayout(
      "email",
      "O link levou a uma página falsa",
      "A simulação parou antes de qualquer preenchimento.",
      fakePage,
      "",
      [],
      "",
      '<section class="scenario-next"><h2>Próximo passo</h2><button type="button" class="decision-button" data-action="complete-scenario" data-value="risk">Ver resultado do desafio</button></section>'
    ),
    "Página falsa simulada. Nenhuma informação pode ser digitada.",
    { focusSelector: "[data-risk-alert]", scrollSelector: "[data-risk-alert]" }
  );
}

function renderSms() {
  const isReply = scenarioStage === "reply";
  const feedback = isReply
    ? '<div class="feedback-card caution"><strong>Prazo ainda menor</strong>O contato aumentou a pressão para evitar uma conferência.</div>'
    : "";
  const decisions = isReply
    ? [
        decisionButton("Abrir o link", "sms-choice", "link"),
        decisionButton("Abrir o aplicativo oficial da transportadora", "sms-choice", "official"),
        decisionButton("Ignorar e excluir", "sms-choice", "ignore"),
      ]
    : [
        decisionButton("Abrir o link", "sms-choice", "link"),
        decisionButton("Responder ao SMS", "sms-choice", "reply"),
        decisionButton("Abrir o aplicativo oficial da transportadora", "sms-choice", "official"),
        decisionButton("Ignorar e excluir", "sms-choice", "ignore"),
      ];

  const smsSimulation = `
    <section class="sms-sim" aria-label="SMS simulado">
      <div class="sms-speaker" aria-hidden="true"></div>
      <header class="sms-header">
        <strong>+55 11 99999-0000</strong>
        <small>Número desconhecido</small>
      </header>
      <div class="sms-messages">
        <span class="sms-time">Hoje, 11:06</span>
        <div class="sms-bubble">
          <strong>AVISO DE ENTREGA:</strong><br /><br />
          Sua encomenda foi retida. Pague a taxa de R$ 4,98 para liberar a entrega:
          <span class="sms-link">https://entrega-rapida.example</span>
        </div>
        ${
          isReply
            ? '<div class="sms-bubble" data-new-message>Para liberar hoje, faça o pagamento pelo link. Após 10 minutos, a encomenda será devolvida.</div>'
            : ""
        }
      </div>
    </section>
  `;

  render(
    scenarioLayout(
      "sms",
      "Entrega retida ou cobrança falsa?",
      "A mensagem pede R$ 4,98 por um link.",
      smsSimulation,
      isReply ? "E agora, o que você faria?" : "O que você faria?",
      decisions,
      feedback
    ),
    "Analise o número, o link e a cobrança antes de responder.",
    {
      focusSelector: isReply ? "[data-new-message]" : "[data-challenge-title]",
      scrollSelector: isReply ? "[data-new-message]" : "[data-challenge-title]",
    }
  );
}

function renderSmsFakePage() {
  const fakePage = `
    <section class="fake-site" aria-label="Página falsa de entrega simulada">
      <span class="fake-site-logo">entrega rápida</span>
      <h2>Taxa de liberação</h2>
      <p>O valor pequeno era uma isca para levar você a uma página que pediria dados pessoais e bancários.</p>
      <p class="fake-data-label">Dados que a página pediria</p>
      <div class="fake-data-list" aria-label="Dados ilustrativos que uma página falsa pediria">
        <span>CPF</span>
        <span>Número do cartão</span>
        <span>Código de segurança</span>
      </div>
      <div class="interruption-overlay" data-risk-alert>
        <strong>O valor pequeno era uma isca.</strong>
        A página tentaria obter seus dados pessoais e bancários.
      </div>
    </section>
  `;

  render(
    scenarioLayout(
      "sms",
      "A cobrança levou a uma página falsa",
      "A simulação parou antes de qualquer dado.",
      fakePage,
      "",
      [],
      "",
      '<section class="scenario-next"><h2>Próximo passo</h2><button type="button" class="decision-button" data-action="complete-scenario" data-value="risk">Ver resultado do desafio</button></section>'
    ),
    "Página falsa simulada. Nenhum dado pode ser informado.",
    { focusSelector: "[data-risk-alert]", scrollSelector: "[data-risk-alert]" }
  );
}

function renderScenarioResult(isSafe, title, text) {
  const scenario = scenarioData[activeScenario];
  const isComplete = completedScenarios.size === Object.keys(scenarioData).length;

  render(`
    <section class="challenge-view scenario-result">
      <div class="result-topline">
        <div>
          <span class="channel-label ${activeScenario}">${scenario.label}</span>
          <p class="result-status ${isSafe ? "safe" : "risk"}">${isSafe ? "Decisão segura" : "Caminho de risco"}</p>
          <h1 class="result-title" data-challenge-title>${title}</h1>
          <p class="result-copy">${text}</p>
        </div>
        ${progressCard()}
      </div>
      <section class="result-details">
        <h2>Sinais para lembrar</h2>
        <ul class="signal-list">${scenario.signals.map((signal) => `<li>${signal}</li>`).join("")}</ul>
      </section>
      <p class="recommended-action"><strong>Atitude recomendada:</strong> ${scenario.recommended}</p>
      <div class="challenge-action-row">
        <button type="button" class="challenge-action secondary" data-action="retry">Refazer este desafio</button>
        <button type="button" class="challenge-action ${isComplete ? "safe" : ""}" data-action="${isComplete ? "view-final" : "back-selection"}">${isComplete ? "Ver resultado final" : "Voltar aos desafios"}</button>
      </div>
    </section>
  `, `${scenario.label}: ${title}`, { scrollSelector: "[data-challenge-title]" });
}

function renderFinal() {
  clearTypingTimeout();
  currentView = "final";
  activeScenario = null;

  const finalSignals = [
    "urgência",
    "pedido de dinheiro",
    "link estranho",
    "remetente desconhecido",
    "pedido de senha ou código",
    "tentativa de impedir confirmação",
    "conta em nome de terceiro",
  ];

  render(`
    <section class="challenge-view final-view">
      <div class="final-topline">
        <div>
          <span class="challenge-eyebrow">Segurança digital</span>
          <p class="final-status">Atividade concluída</p>
          <h1 class="final-title" data-challenge-title>Você analisou os três desafios</h1>
          <p class="final-copy">WhatsApp, e-mail e SMS podem usar urgência para impedir uma confirmação.</p>
        </div>
        ${progressCard()}
      </div>
      <div class="final-rule-copy">
        <strong>Pare. Confira. Decida.</strong>
        Antes de agir, confirme pelo contato, aplicativo ou site oficial.
      </div>
      <ul class="final-signal-list">${finalSignals.map((signal) => `<li>${signal}</li>`).join("")}</ul>
      <div class="challenge-action-row">
        <button type="button" class="challenge-action" data-action="restart-all">Refazer desafios</button>
        <button type="button" class="challenge-action secondary" data-action="back-selection">Rever apenas um cenário</button>
        <a class="challenge-action secondary" href="../ferramentas/">Voltar para Ferramentas</a>
      </div>
    </section>
  `, "Desafio Antigolpe concluído. Pare, confira, decida.");
}

function startScenario(scenario) {
  clearTypingTimeout();
  activeScenario = scenario;
  currentView = "scenario";
  scenarioStage = "start";
  emailAddressExpanded = false;
  emailLinkExpanded = false;

  if (scenario === "whatsapp") {
    startWhatsapp();
    return;
  }

  if (scenario === "email") renderEmail();
  if (scenario === "sms") renderSms();
}

function completeScenario(isSafe, title, text) {
  clearTypingTimeout();
  completedScenarios.add(activeScenario);
  currentView = "result";
  renderScenarioResult(isSafe, title, text);
}

function handleWhatsappChoice(value) {
  if (value === "pix") {
    scenarioStage = "pix";
    renderWhatsapp();
    return;
  }

  if (value === "audio") {
    scenarioStage = "audio";
    renderWhatsapp();
    return;
  }

  if (value === "pay" || value === "believe") {
    completeScenario(false, "A urgência levou a uma decisão insegura", "O golpista ganhou espaço porque a confirmação não aconteceu por um contato já conhecido.");
    return;
  }

  if (value === "old-phone") {
    completeScenario(true, "Você confirmou pelo número antigo", "A pessoa informou que não trocou de número. Você usou um contato que já conhecia.");
    return;
  }

  if (value === "family") {
    completeScenario(true, "Outro familiar confirmou a situação", "Outro familiar confirmou que a mensagem era falsa. Você interrompeu a tentativa de golpe.");
    return;
  }

  if (value === "confirm") {
    completeScenario(true, "Você parou para confirmar", "Em vez de fazer o Pix, você escolheu confirmar por outro contato conhecido.");
  }
}

function handleEmailChoice(value) {
  if (value === "link") {
    currentView = "email-fake";
    renderEmailFakePage();
    return;
  }

  if (value === "reply") {
    scenarioStage = "reply";
    renderEmail();
    return;
  }

  if (value === "official") {
    completeScenario(true, "Você abriu o canal oficial por conta própria", "No canal oficial não havia nenhum aviso de bloqueio. Você não usou o botão recebido.");
    return;
  }

  if (value === "report") {
    completeScenario(true, "Você denunciou a mensagem suspeita", "A mensagem foi marcada como phishing. Você evitou clicar e ajudou a proteger a caixa de entrada.");
  }
}

function handleSmsChoice(value) {
  if (value === "link") {
    currentView = "sms-fake";
    renderSmsFakePage();
    return;
  }

  if (value === "reply") {
    scenarioStage = "reply";
    renderSms();
    return;
  }

  if (value === "official") {
    completeScenario(true, "Você consultou o aplicativo oficial", "O aplicativo oficial não mostrou nenhuma encomenda retida. Você não usou o link recebido.");
    return;
  }

  if (value === "ignore") {
    completeScenario(true, "Você ignorou e excluiu a mensagem", "Você evitou interagir com um número e um link desconhecidos.");
  }
}

function handleAction(event) {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;

  const { action, scenario, value } = actionElement.dataset;

  if (action === "start") renderSelection();
  if (action === "start-scenario") startScenario(scenario);
  if (action === "back-selection") renderSelection();
  if (action === "retry") startScenario(activeScenario);
  if (action === "view-final") renderFinal();
  if (action === "restart-all") {
    completedScenarios.clear();
    renderIntro();
  }
  if (action === "whatsapp-choice") handleWhatsappChoice(value);
  if (action === "email-choice") handleEmailChoice(value);
  if (action === "sms-choice") handleSmsChoice(value);
  if (action === "complete-scenario") completeScenario(false, "Você abriu um link falso", "O link poderia levar à perda de dados. A simulação parou antes de qualquer preenchimento.");
  if (action === "email-sender") {
    emailAddressExpanded = !emailAddressExpanded;
    renderEmail({ focusSelector: "[data-action=\"email-sender\"]", scrollSelector: "" });
  }
  if (action === "email-link-address") {
    emailLinkExpanded = !emailLinkExpanded;
    renderEmail({ focusSelector: "[data-action=\"email-link-address\"]", scrollSelector: "" });
  }
}

challengeApp.addEventListener("click", handleAction);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && currentView === "scenario") {
    renderSelection();
  }
});

renderIntro();
