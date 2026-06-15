function signatureLogo() {
  return `
    <span class="sign-logo" aria-label="gov.br">
      <span class="blue">g</span><span class="yellow">o</span><span class="green">v</span><span class="blue">.br</span>
    </span>
  `;
}

function signatureTrainingBar() {
  return '<div class="sign-training-bar">Ambiente de treinamento — não use dados reais.</div>';
}

function signatureHeader(label = "Portal de assinatura") {
  return `
    <header class="sign-header">
      ${signatureLogo()}
      <strong>${label}</strong>
      <span class="sign-chip">Simulação</span>
    </header>
  `;
}

function signatureStepper(activeStep) {
  const labels = ["Escolher arquivo", "Assinar arquivo", "Baixar arquivo"];

  return `
    <ol class="sign-stepper" aria-label="Etapas ilustrativas da assinatura">
      ${labels
        .map((label, index) => {
          const step = index + 1;
          const state = step === activeStep ? "active" : step < activeStep ? "done" : "";
          return `
            <li class="sign-stepper-item ${state}">
              <strong>${step}</strong>
              <span>${label}</span>
            </li>
          `;
        })
        .join("")}
    </ol>
  `;
}

function documentViewer({ signed = false } = {}) {
  return `
    <div class="document-viewer">
      <div class="viewer-toolbar">
        <span>documento-treinamento.pdf</span>
        <span>1 de 1 · Ajustar à janela</span>
      </div>
      <div class="viewer-body">
        <article class="training-document" aria-label="Documento fictício de treinamento">
          <h3>Documento de treinamento</h3>
          <p class="no-legal-value">Sem valor legal</p>
          <div class="document-lines" aria-hidden="true"></div>
          ${
            signed
              ? `
                <div class="signed-stamp">
                  <strong>gov.br</strong>
                  Assinatura eletrônica simulada<br />
                  Documento de treinamento
                </div>
              `
              : `
                <button type="button" class="signature-position top" data-position="top">
                  Área da assinatura<br />Clique para posicionar
                </button>
                <button type="button" class="signature-position middle" data-position="middle">
                  Área da assinatura<br />Clique para posicionar
                </button>
                <button type="button" class="signature-position bottom selected" data-position="bottom">
                  Área da assinatura<br />Clique para posicionar
                </button>
              `
          }
          <p class="document-note">Conteúdo propositalmente genérico para uso em oficina.</p>
        </article>
      </div>
    </div>
  `;
}

const signatureSteps = [
  {
    title: "Antes de começar",
    explanation:
      "Este treinamento apresenta o caminho geral para assinar um documento digital pelo gov.br. Nenhum documento real será enviado ou assinado.",
    tip: "<strong>Regra principal</strong>Não informe CPF, senha, código de segurança, dados bancários ou documentos pessoais nesta página.",
    screen: `
      <article class="sign-view sign-welcome">
        ${signatureTrainingBar()}
        <div class="sign-welcome-content">
          <span class="sign-chip">Treinamento seguro</span>
          <div class="sign-document-mark" aria-hidden="true"></div>
          <h2>Assinatura Eletrônica gov.br</h2>
          <p>Conheça as etapas antes de acessar o serviço oficial.</p>
          <ul class="sign-warning-list">
            <li>Não haverá login ou código real.</li>
            <li>Nenhum arquivo será enviado.</li>
            <li>Nenhum documento será assinado.</li>
          </ul>
          <button type="button" class="sign-action" data-action="next">Começar simulação</button>
        </div>
      </article>
    `,
  },
  {
    title: "Confira o nível da conta",
    explanation:
      "A assinatura eletrônica exige uma conta gov.br Prata ou Ouro. Uma conta Bronze ainda não permite assinar documentos.",
    tip: "<strong>Biometria não faz parte desta oficina</strong>Qualquer aumento real de nível deve ser feito pelo dono da conta, em ambiente privado e seguro.",
    screen: `
      <article class="sign-view level-stage">
        <section class="level-phone" aria-label="Tela ilustrativa dos níveis da conta gov.br">
          ${signatureTrainingBar()}
          <div class="level-phone-header">${signatureLogo()}</div>
          <div class="level-phone-title">Nível da conta</div>
          <div class="level-phone-content">
            <h2>Conta gov.br</h2>
            <p>Veja quais níveis permitem usar a assinatura eletrônica.</p>
            <section class="level-card bronze">
              <span class="level-medal" aria-hidden="true">B</span>
              <div>
                <h3>Bronze</h3>
                <p>Acesso básico. Não permite assinatura eletrônica.</p>
              </div>
            </section>
            <section class="level-card allowed">
              <span class="level-medal" aria-hidden="true">★</span>
              <div>
                <h3>Prata ou Ouro</h3>
                <p>Permite usar a assinatura eletrônica gov.br.</p>
              </div>
            </section>
            <button type="button" class="sign-action" data-action="next">Entendi</button>
          </div>
        </section>
      </article>
    `,
  },
  {
    title: "Entre no portal oficial",
    explanation:
      "No serviço oficial, o botão Entrar com gov.br inicia a identificação da pessoa. Aqui ele apenas avança a demonstração.",
    tip: "<strong>Confira o endereço antes de entrar</strong>Não use links recebidos por mensagens. A oficina mostra a aparência geral, não realiza login.",
    screen: `
      <article class="sign-view portal-entry">
        ${signatureTrainingBar()}
        ${signatureHeader()}
        <div class="sign-content">
          <div class="portal-lock" aria-hidden="true">✓</div>
          <h2>Portal de assinatura</h2>
          <p>Serviço de assinatura eletrônica de documentos.</p>
          <button type="button" class="sign-action" data-action="next">Entrar com gov.br</button>
        </div>
      </article>
    `,
  },
  {
    title: "Escolha o arquivo correto",
    explanation:
      "O portal permite selecionar o documento que será assinado. Nesta simulação, o botão sempre escolhe um PDF fictício.",
    tip: "<strong>Leia o nome do arquivo</strong>Na vida real, confirme que é o documento certo antes de continuar.",
    screen: `
      <article class="sign-view">
        ${signatureTrainingBar()}
        ${signatureHeader("Assinatura de documento")}
        ${signatureStepper(1)}
        <div class="sign-content">
          <h2 class="document-page-title">Assinatura de documento</h2>
          <section class="upload-box">
            <span class="upload-icon" aria-hidden="true">＋</span>
            <h3>Arraste e solte o arquivo aqui</h3>
            <p>Na oficina usaremos somente um documento fictício.</p>
            <button type="button" class="sign-action" data-action="next">Escolher arquivo</button>
          </section>
        </div>
      </article>
    `,
  },
  {
    title: "Confira o arquivo carregado",
    explanation:
      "Antes de assinar, leia o nome e confirme se o arquivo escolhido é realmente o documento desejado.",
    tip: "<strong>Arquivo de treinamento</strong>O nome fixo e o aviso de simulação evitam qualquer confusão com um documento verdadeiro.",
    screen: `
      <article class="sign-view">
        ${signatureTrainingBar()}
        ${signatureHeader("Assinatura de documento")}
        ${signatureStepper(1)}
        <div class="sign-content">
          <h2 class="document-page-title">Arquivo escolhido</h2>
          <section class="fake-file-card">
            <span class="fake-file-icon">PDF</span>
            <div>
              <h3>documento-treinamento.pdf</h3>
              <p>Arquivo carregado para simulação</p>
            </div>
            <span class="fake-file-check" aria-hidden="true">✓</span>
          </section>
          <div class="file-confirm-actions">
            <button type="button" class="sign-action" data-action="next">Avançar para assinatura</button>
          </div>
        </div>
      </article>
    `,
  },
  {
    title: "Posicione a área da assinatura",
    explanation:
      "Clique em uma das três posições do documento para mover a caixa pontilhada. Evite cobrir informações importantes.",
    tip: "<strong>O documento é totalmente fictício</strong>A interação apenas muda uma caixa na tela; nada é enviado ou alterado no computador.",
    screen: `
      <article class="sign-view">
        ${signatureTrainingBar()}
        ${signatureStepper(2)}
        ${documentViewer()}
        <div class="viewer-actions">
          <button type="button" class="sign-action outline" data-action="previous">Voltar</button>
          <button type="button" class="sign-action" data-action="next">Assinar digitalmente</button>
        </div>
      </article>
    `,
  },
  {
    title: "Escolha o provedor GovBR",
    explanation:
      "Nesta etapa, o portal confirma que a assinatura será feita usando a conta gov.br.",
    tip: "<strong>Uma opção, uma decisão</strong>Leia o nome do provedor antes de selecionar. Nesta simulação existe apenas a opção GovBR.",
    screen: `
      <article class="sign-view provider-stage">
        ${signatureTrainingBar()}
        ${signatureStepper(2)}
        ${documentViewer()}
        <section class="provider-modal" role="dialog" aria-modal="true" aria-labelledby="provider-title">
          <div class="provider-modal-header">
            ${signatureLogo()}
            <h2 id="provider-title">Portal de assinatura</h2>
          </div>
          <p>Escolha o provedor de assinatura:</p>
          <button type="button" class="provider-option" data-action="next">
            ${signatureLogo()}
            <span>
              <h3>GovBR</h3>
              <p>Assinatura eletrônica usando sua conta gov.br</p>
            </span>
            <span class="provider-arrow" aria-hidden="true">›</span>
          </button>
        </section>
      </article>
    `,
  },
  {
    title: "Proteja o código de segurança",
    explanation:
      "No serviço oficial, um código pode chegar no aplicativo gov.br ou em outro canal configurado. Ele confirma a autorização.",
    tip: "<strong>O código é secreto</strong>Nunca fale em voz alta e nunca envie por WhatsApp. O número desta tela é fixo e fictício.",
    screen: `
      <article class="sign-view code-stage">
        ${signatureTrainingBar()}
        ${signatureHeader("Autorizar assinatura")}
        ${signatureStepper(2)}
        <div class="sign-content">
          <section class="code-card">
            <h2>Código de segurança</h2>
            <p>Na vida real, consulte o canal indicado pelo serviço oficial.</p>
            <span class="fake-code-label">Código fictício da oficina</span>
            <div class="fake-code" aria-label="Código fictício zero zero zero zero zero zero">000000</div>
            <div class="code-alert">
              Nunca fale o código em voz alta. Nunca envie esse código por WhatsApp.
            </div>
            <button type="button" class="sign-action" data-action="next">Autorizar assinatura</button>
          </section>
        </div>
      </article>
    `,
  },
  {
    title: "Baixe e guarde o arquivo",
    explanation:
      "Depois da autorização, o portal apresenta o documento assinado. O arquivo digital deve ser salvo em uma pasta segura.",
    tip: "<strong>Não dependa apenas do papel</strong>A assinatura acompanha o arquivo digital. Nesta página, o botão mostra somente uma mensagem educativa.",
    screen: `
      <article class="sign-view">
        ${signatureTrainingBar()}
        ${signatureStepper(3)}
        ${documentViewer({ signed: true })}
        <div id="download-notice" class="download-notice" role="status" aria-live="polite">
          Simulação: na vida real, salve o arquivo assinado em uma pasta segura.
        </div>
        <div class="viewer-actions">
          <button type="button" class="sign-action outline" data-action="restart">Assinar outro documento</button>
          <button type="button" class="sign-action success" data-action="simulate-download">Baixar arquivo assinado</button>
        </div>
      </article>
    `,
  },
  {
    title: "Leve estas regras com você",
    explanation:
      "Assinar um documento é confirmar que você concorda com o conteúdo. Faça isso com calma e somente pelos canais oficiais.",
    tip: "<strong>O instrutor orienta; o dono da conta decide</strong>Não assine algo que você não entendeu e não entregue senha ou código a terceiros.",
    screen: `
      <article class="sign-view security-stage">
        ${signatureTrainingBar()}
        <div class="sign-content">
          <span class="sign-chip">Fim do treinamento</span>
          <h2>Assine com segurança</h2>
          <p>Antes de sair, relembre estas regras:</p>
          <ul class="signature-security-list">
            <li>Use apenas o site oficial.</li>
            <li>Confira se o documento é o correto.</li>
            <li>Não compartilhe sua senha gov.br.</li>
            <li>Não fale o código de segurança em voz alta.</li>
            <li>Não assine um documento que você não entendeu.</li>
            <li>Depois de assinar, baixe e guarde o arquivo.</li>
          </ul>
          <p class="signature-owner-reminder">
            O instrutor orienta. Quem confirma e autoriza é o dono da conta.
          </p>
          <button type="button" class="sign-action success" data-action="restart">Rever treinamento</button>
        </div>
      </article>
    `,
  },
];

let signatureCurrentStep = 0;

const signatureScreen = document.getElementById("signature-screen");
const signatureTitle = document.getElementById("signature-step-title");
const signatureExplanation = document.getElementById("signature-step-explanation");
const signatureTip = document.getElementById("signature-step-tip");
const signatureCounter = document.getElementById("signature-step-counter");
const signatureProgress = document.getElementById("signature-progress");
const signaturePrevious = document.getElementById("signature-prev-step");
const signatureNext = document.getElementById("signature-next-step");

function renderSignatureStep({ focusHeading = false } = {}) {
  const step = signatureSteps[signatureCurrentStep];
  const progress = ((signatureCurrentStep + 1) / signatureSteps.length) * 100;

  signatureScreen.innerHTML = step.screen;
  signatureTitle.textContent = step.title;
  signatureExplanation.textContent = step.explanation;
  signatureTip.innerHTML = step.tip;
  signatureCounter.textContent = `Etapa ${signatureCurrentStep + 1} de ${signatureSteps.length}`;
  signatureProgress.style.setProperty("--progress", `${progress}%`);
  signatureProgress.setAttribute("aria-valuenow", String(signatureCurrentStep + 1));
  signatureProgress.setAttribute(
    "aria-valuetext",
    `Etapa ${signatureCurrentStep + 1} de ${signatureSteps.length}`
  );
  signaturePrevious.disabled = signatureCurrentStep === 0;
  signatureNext.textContent =
    signatureCurrentStep === signatureSteps.length - 1 ? "Reiniciar" : "Próximo";

  if (focusHeading) {
    signatureTitle.setAttribute("tabindex", "-1");
    signatureTitle.focus({ preventScroll: true });
  }
}

function setSignatureStep(stepIndex, options = {}) {
  signatureCurrentStep = Math.max(0, Math.min(signatureSteps.length - 1, stepIndex));
  renderSignatureStep(options);
}

function previousSignatureStep() {
  if (signatureCurrentStep > 0) {
    setSignatureStep(signatureCurrentStep - 1, { focusHeading: true });
  }
}

function nextSignatureStep() {
  if (signatureCurrentStep === signatureSteps.length - 1) {
    setSignatureStep(0, { focusHeading: true });
    return;
  }

  setSignatureStep(signatureCurrentStep + 1, { focusHeading: true });
}

function selectSignaturePosition(button) {
  signatureScreen.querySelectorAll("[data-position]").forEach((position) => {
    position.classList.toggle("selected", position === button);
  });
}

function showDownloadMessage() {
  const notice = signatureScreen.querySelector("#download-notice");
  if (!notice) return;

  notice.classList.add("visible");
}

function handleSignatureScreenClick(event) {
  const positionButton = event.target.closest("[data-position]");
  if (positionButton) {
    selectSignaturePosition(positionButton);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;

  if (action === "next") nextSignatureStep();
  if (action === "previous") previousSignatureStep();
  if (action === "restart") setSignatureStep(0, { focusHeading: true });
  if (action === "simulate-download") showDownloadMessage();
}

signaturePrevious.addEventListener("click", previousSignatureStep);
signatureNext.addEventListener("click", nextSignatureStep);
signatureScreen.addEventListener("click", handleSignatureScreenClick);

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    nextSignatureStep();
  }

  if (event.key === "ArrowLeft") {
    previousSignatureStep();
  }
});

renderSignatureStep();
