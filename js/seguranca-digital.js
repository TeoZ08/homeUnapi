const challengeApp = document.getElementById("challenge-app");
const challengeAnnouncement = document.getElementById("challenge-announcement");
const completedScenarios = new Set();

let currentView = "intro";
let activeScenario = null;
let scenarioStage = "start";
let typingTimeout = null;
let emailAddressExpanded = false;

const scenarioData = {
  whatsapp: {
    label: "WhatsApp",
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

function focusChallengeTitle() {
  const title = challengeApp.querySelector("[data-challenge-title]");
  if (!title) return;

  title.setAttribute("tabindex", "-1");
  title.focus({ preventScroll: true });
}

function render(content, announcement = "") {
  challengeApp.innerHTML = content;
  announce(announcement);
  requestAnimationFrame(focusChallengeTitle);
}

function ruleBanner() {
  return `
    <div class="rule-banner" aria-label="Regra de segurança: Pare, confira, decida">
      <span>PARE</span>
      <span>CONFIRA</span>
      <span>DECIDA</span>
    </div>
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
        Você recebeu uma mensagem inesperada. Ela é verdadeira ou é uma tentativa de golpe?
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
          <span class="challenge-eyebrow">Escolha um canal</span>
          <h1 class="challenge-selection-title" data-challenge-title>Qual desafio você quer praticar?</h1>
          <p class="challenge-selection-copy">Você pode fazer os três desafios em qualquer ordem.</p>
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
                  <h3>${scenario.label}</h3>
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

function scenarioSide(channel, title, summary, decisionTitle, decisionCopy, decisions, feedback = "") {
  return `
    <aside class="scenario-side">
      <div class="scenario-topline">
        <div>
          <span class="channel-label ${channel}">${scenarioData[channel].label}</span>
          <h1 class="scenario-heading" data-challenge-title>${title}</h1>
          <p class="scenario-summary">${summary}</p>
        </div>
        ${progressCard()}
      </div>
      <p class="rule-mini">PARE antes de responder. CONFIRA por um contato ou canal oficial. DECIDA só depois.</p>
      ${feedback}
      ${
        decisions.length
          ? `
            <section class="decision-panel" aria-label="Decisão do desafio">
              <h3>${decisionTitle}</h3>
              <p>${decisionCopy}</p>
              <div class="decision-grid">${decisions.join("")}</div>
            </section>
          `
          : ""
      }
      <div class="scenario-navigation">
        <button type="button" class="mini-action secondary" data-action="back-selection">Voltar aos desafios</button>
      </div>
    </aside>
  `;
}

function decisionButton(label, action, value = "") {
  return `<button type="button" class="decision-button" data-action="${action}" ${value ? `data-value="${value}"` : ""}>${label}</button>`;
}

function messageBubble(text, type = "incoming", time = "10:12") {
  return `
    <div class="message-bubble ${type}">
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
      decisionButton("Qual é a chave Pix?", "whatsapp-choice", "pix"),
      decisionButton("Me envie um áudio para confirmar.", "whatsapp-choice", "audio"),
      decisionButton("Vou ligar para o seu número antigo.", "whatsapp-choice", "old-phone"),
      decisionButton("Vou confirmar com outro familiar.", "whatsapp-choice", "family"),
    ];
  }

  if (scenarioStage === "pix") {
    responses.push(messageBubble("Pode mandar para esta conta. Ela está no nome de um amigo meu porque meu banco está com problema.", "incoming", "10:15"));
    feedback = '<div class="feedback-card caution"><strong>Sinal de golpe encontrado</strong>A conversa avançou para o pagamento. Conta em nome de outra pessoa é um sinal importante de alerta.</div>';
    decisions = [
      decisionButton("Fazer o pagamento", "whatsapp-choice", "pay"),
      decisionButton("Parar e confirmar por outro contato", "whatsapp-choice", "confirm"),
    ];
  }

  if (scenarioStage === "audio") {
    responses.push(messageBubble("Agora não consigo falar. O microfone deste celular está quebrado. É urgente!", "incoming", "10:15"));
    feedback = '<div class="feedback-card caution"><strong>Atenção</strong>O golpista criou uma desculpa e manteve a urgência. Um áudio também pode ser falso ou reaproveitado.</div>';
    decisions = [
      decisionButton("Continuar acreditando", "whatsapp-choice", "believe"),
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
          <small>Simulação educativa</small>
        </div>
      </header>
      <div class="chat-messages">
        ${messageBubble("Oi, mãe! Este é meu número novo. Meu celular antigo estragou. Salva esse aqui.", "incoming", "10:10")}
        ${hasRequest ? messageBubble("Estou tentando pagar uma conta, mas meu banco travou. Você consegue fazer um Pix para mim? Amanhã eu devolvo.", "incoming", "10:12") : '<div class="typing-indicator">digitando<span>...</span></div>'}
        ${responses.join("")}
      </div>
    </section>
  `;

  render(`
    <section class="challenge-view">
      <div class="scenario-shell">
        <div>${conversation}</div>
        ${scenarioSide(
          "whatsapp",
          "Mensagem de familiar ou golpe?",
          "A pessoa diz ter trocado de número e pede um Pix com urgência.",
          "O que você responderia?",
          "Escolha uma resposta pronta para ver como a conversa evolui.",
          decisions,
          feedback
        )}
      </div>
    </section>
  `, isWaiting ? "O contato está digitando uma nova mensagem." : "Analise a conversa antes de responder.");
}

function startWhatsapp() {
  scenarioStage = "waiting";
  renderWhatsapp();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  typingTimeout = window.setTimeout(() => {
    typingTimeout = null;
    if (activeScenario === "whatsapp" && scenarioStage === "waiting") {
      scenarioStage = "decision";
      renderWhatsapp();
    }
  }, reducedMotion ? 0 : 700);
}

function renderEmail() {
  const showAddress = emailAddressExpanded || scenarioStage === "reply";
  const isReply = scenarioStage === "reply";
  const feedback = isReply
    ? '<div class="feedback-card caution"><strong>Atenção</strong>Responder mantém o contato com o golpista. A própria resposta tenta empurrar você novamente para o link.</div>'
    : "";
  const decisions = isReply
    ? [
        decisionButton("Usar o botão enviado", "email-choice", "link"),
        decisionButton("Abrir o serviço pelo endereço oficial", "email-choice", "official"),
        decisionButton("Denunciar phishing", "email-choice", "report"),
      ]
    : [
        decisionButton("Clicar em “Verificar conta agora”", "email-choice", "link"),
        decisionButton("Responder perguntando se a mensagem é verdadeira", "email-choice", "reply"),
        decisionButton("Abrir o serviço pelo endereço oficial", "email-choice", "official"),
        decisionButton("Denunciar phishing", "email-choice", "report"),
      ];

  const emailSimulation = `
    <section class="email-sim" aria-label="E-mail simulado">
      <header class="email-topbar">
        <span class="email-wordmark">e-mail</span>
        <span class="email-simulation-chip">Simulação</span>
      </header>
      <div class="email-layout">
        <aside class="email-sidebar" aria-label="Pastas ilustrativas">
          <span class="active">Caixa de entrada</span>
          <span>Favoritos</span>
          <span>Enviados</span>
          <span>Lixeira</span>
        </aside>
        <article class="email-message">
          <h2 class="email-subject">AÇÃO NECESSÁRIA: sua conta será bloqueada hoje</h2>
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
            <button type="button" class="fake-email-link" data-action="email-choice" data-value="link">VERIFICAR CONTA AGORA</button>
            <span class="link-preview" aria-live="polite">Destino simulado: conta-segura.example/verificar</span>
            ${isReply ? '<p><strong>Resposta simulada:</strong> Para evitar o bloqueio, use somente o botão enviado. Não podemos confirmar sua conta por outro canal.</p>' : ""}
          </div>
          <div class="email-actions">
            <button type="button" class="email-action" data-action="email-choice" data-value="reply">Responder</button>
            <button type="button" class="email-action" data-action="email-choice" data-value="report">Denunciar phishing</button>
            <button type="button" class="email-action" data-action="email-choice" data-value="official">Abrir canal oficial</button>
          </div>
        </article>
      </div>
    </section>
  `;

  render(`
    <section class="challenge-view">
      <div class="scenario-shell">
        <div>${emailSimulation}</div>
        ${scenarioSide(
          "email",
          "E-mail importante ou ameaça falsa?",
          "A mensagem usa prazo curto e bloqueio para apressar sua decisão.",
          isReply ? "O que fazer depois da resposta?" : "Qual seria sua atitude?",
          isReply ? "A mensagem voltou a empurrar você para o link." : "Antes de clicar, confira o remetente e o endereço mostrado.",
          decisions,
          feedback
        )}
      </div>
    </section>
  `, "Analise o remetente, o prazo e o destino do botão antes de agir.");
}

function renderEmailFakePage() {
  render(`
    <section class="challenge-view">
      <div class="scenario-shell">
        <section class="fake-site" aria-label="Página falsa simulada">
          <span class="fake-site-logo">conta segura</span>
          <h3>Confirme sua conta</h3>
          <p>A página imita uma área de segurança e tentaria recolher seus dados.</p>
          <div class="fake-field-list" aria-label="Campos bloqueados e apenas ilustrativos">
            <div class="fake-field">E-mail</div>
            <div class="fake-field">Senha</div>
            <div class="fake-field">Telefone</div>
            <div class="fake-field">Código de segurança</div>
          </div>
          <div class="interruption-overlay">
            <strong>Cuidado: você entrou em uma página falsa.</strong>
            A página usou medo e urgência para tentar obter sua senha e seus dados.
          </div>
        </section>
        ${scenarioSide(
          "email",
          "O link levou a uma página falsa",
          "A simulação interrompe antes de qualquer preenchimento para mostrar o risco.",
          "O que você aprendeu?",
          "Links recebidos por mensagem podem levar a cópias de serviços conhecidos.",
          [decisionButton("Concluir este desafio", "complete-scenario", "risk")],
          '<div class="feedback-card danger"><strong>Atenção</strong>Urgência e pedido de senha ou código são sinais fortes para parar e conferir por outro canal.</div>'
        )}
      </div>
    </section>
  `, "Página falsa simulada. Nenhuma informação pode ser digitada.");
}

function renderSms() {
  const isReply = scenarioStage === "reply";
  const feedback = isReply
    ? '<div class="feedback-card caution"><strong>Atenção</strong>A resposta aumentou a pressão e criou um prazo ainda menor.</div>'
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
        <small>Número desconhecido · Simulação</small>
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
            ? '<div class="sms-bubble">Para liberar hoje, faça o pagamento pelo link. Após 10 minutos, a encomenda será devolvida.</div>'
            : ""
        }
      </div>
    </section>
  `;

  render(`
    <section class="challenge-view">
      <div class="scenario-shell">
        <div>${smsSimulation}</div>
        ${scenarioSide(
          "sms",
          "Entrega retida ou cobrança falsa?",
          "A mensagem inesperada cobra um valor pequeno e pede ação imediata.",
          isReply ? "O que fazer agora?" : "Qual seria sua atitude?",
          isReply ? "O contato colocou mais pressão para impedir que você conferisse." : "Não use o link antes de conferir a entrega por um canal oficial.",
          decisions,
          feedback
        )}
      </div>
    </section>
  `, "Analise o número, o link e a cobrança antes de responder.");
}

function renderSmsFakePage() {
  render(`
    <section class="challenge-view">
      <div class="scenario-shell">
        <section class="fake-site" aria-label="Página falsa de entrega simulada">
          <span class="fake-site-logo">entrega rápida</span>
          <h3>Taxa de liberação</h3>
          <p>O valor pequeno era uma isca para levar você a uma página que pediria dados pessoais e bancários.</p>
          <div class="fake-field-list" aria-label="Campos bloqueados e apenas ilustrativos">
            <div class="fake-field">CPF</div>
            <div class="fake-field">Endereço</div>
            <div class="fake-field">Número do cartão</div>
            <div class="fake-field">Validade e código de segurança</div>
          </div>
          <div class="interruption-overlay">
            <strong>O valor pequeno era uma isca.</strong>
            A página tentaria obter seus dados pessoais e bancários.
          </div>
        </section>
        ${scenarioSide(
          "sms",
          "A cobrança levou a uma página falsa",
          "A simulação foi interrompida antes de qualquer dado para mostrar o perigo do link.",
          "O que você aprendeu?",
          "Uma taxa pequena não torna a cobrança confiável. Confirme a entrega pelo aplicativo oficial.",
          [decisionButton("Concluir este desafio", "complete-scenario", "risk")],
          '<div class="feedback-card danger"><strong>Atenção</strong>Número desconhecido, link inesperado, prazo curto e pedido de cartão formam uma combinação de alerta.</div>'
        )}
      </div>
    </section>
  `, "Página falsa simulada. Nenhum dado pode ser informado.");
}

function renderScenarioResult(kind, isSafe, title, text) {
  const scenario = scenarioData[activeScenario];
  const isComplete = completedScenarios.size === Object.keys(scenarioData).length;

  render(`
    <section class="challenge-view scenario-result">
      <div class="result-topline">
        <div>
          <span class="channel-label ${activeScenario}">${scenario.label}</span>
          <div class="result-symbol ${isSafe ? "safe" : "risk"}" aria-hidden="true">${isSafe ? "✓" : "!"}</div>
          <h1 class="result-title" data-challenge-title>${title}</h1>
          <p class="result-copy">${text}</p>
        </div>
        ${progressCard()}
      </div>
      <div class="feedback-card ${isSafe ? "safe" : "danger"}">
        <strong>${isSafe ? "Boa decisão" : "Sinal de golpe encontrado"}</strong>
        ${
          isSafe
            ? "Você interrompeu a pressão e confirmou por um canal mais seguro."
            : "A simulação mostrou como uma resposta apressada mantém você dentro do caminho criado pelo golpista."
        }
      </div>
      <div>
        <h2 class="result-title">Sinais para lembrar</h2>
        <ul class="signal-list">${scenario.signals.map((signal) => `<li>${signal}</li>`).join("")}</ul>
      </div>
      <p class="recommended-action"><strong>Atitude recomendada:</strong> ${scenario.recommended}</p>
      <div class="challenge-action-row">
        <button type="button" class="challenge-action secondary" data-action="retry">Refazer este desafio</button>
        <button type="button" class="challenge-action ${isComplete ? "safe" : ""}" data-action="${isComplete ? "view-final" : "back-selection"}">${isComplete ? "Ver resultado final" : "Voltar aos desafios"}</button>
      </div>
    </section>
  `, `${scenario.label}: ${title}`);
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
          <div class="final-check" aria-hidden="true">✓</div>
          <h1 class="final-title" data-challenge-title>Desafio Antigolpe concluído</h1>
          <p class="final-copy">Você analisou golpes no WhatsApp, e-mail e SMS.</p>
        </div>
        ${progressCard()}
      </div>
      <ul class="final-signal-list">${finalSignals.map((signal) => `<li>${signal}</li>`).join("")}</ul>
      <div class="final-rule-copy">
        <strong>PARE → CONFIRA → DECIDA</strong>
        PARE antes de responder. CONFIRA pelo contato, aplicativo ou site oficial. DECIDA somente depois da confirmação.
      </div>
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
  renderScenarioResult(activeScenario, isSafe, title, text);
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
  if (action === "complete-scenario") completeScenario(false, "A tentativa foi interrompida", "Você viu como a página falsa tentaria obter informações. Agora sabe onde parar.");
  if (action === "email-sender") {
    emailAddressExpanded = !emailAddressExpanded;
    renderEmail();
  }
}

challengeApp.addEventListener("click", handleAction);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && currentView === "scenario") {
    renderSelection();
  }
});

renderIntro();
