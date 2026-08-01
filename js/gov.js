const accountSteps = ["Dados Cadastrais", "Validar Dados", "Habilitar Cadastro", "Cadastrar Senha"];
const accountStepTargets = [4, 5, 6, 8];

function govLogo() {
  return `
    <span class="gov-logo" aria-label="gov.br">
      <span class="logo-g">g</span><span class="logo-o">o</span><span class="logo-v">v</span><span class="logo-dot">.</span><span class="logo-br">br</span>
    </span>
  `;
}

function pageFrame(content, breadcrumb = "Criar conta com CPF") {
  return `
    <article class="gov-browser">
      <header class="official-header">
        <div>${govLogo()}</div>
        <div class="official-links">
          <span>Alto Contraste</span>
          <span>VLibras</span>
        </div>
      </header>
      <div class="breadcrumb">⌂ &nbsp;›&nbsp; ${breadcrumb}</div>
      ${content}
    </article>
  `;
}

function accountStepper(activeIndex) {
  return `
    <ol class="account-stepper" aria-label="Etapas do cadastro">
      ${accountSteps
        .map((label, index) => {
          const step = index + 1;
          const state = step === activeIndex ? "active" : step < activeIndex ? "done" : "";
          return `
            <li class="${state}">
              <button type="button" data-go-step="${accountStepTargets[index]}" aria-label="Ir para ${label}">
                <span>${label}</span>
                <strong ${step === activeIndex ? 'aria-current="step"' : ""}>${step}</strong>
              </button>
            </li>
          `;
        })
        .join("")}
    </ol>
  `;
}

function accountPage(activeIndex, body) {
  return pageFrame(`
    <main class="account-page">
      <h1>Criar conta com CPF</h1>
      ${accountStepper(activeIndex)}
      ${body}
    </main>
  `);
}

function actionBar(primaryLabel = "Avançar", extraButtons = "") {
  return `
    <div class="action-bar">
      <button type="button" class="link-action" data-action="reset">Recomeçar guia</button>
      <div class="action-buttons">
        ${extraButtons}
        <button type="button" class="primary-action active-target" data-action="next">${primaryLabel}</button>
      </div>
    </div>
  `;
}

function loginPage({ highlight = "create" } = {}) {
  const createClass = highlight === "create" ? "active-target" : "";
  const inputClass = highlight === "document" ? "active-target" : "";
  const buttonClass = highlight === "continue" ? "active-target" : "";

  return pageFrame(`
    <main class="login-page">
      <section class="login-intro">
        <div class="gov-illustration" aria-hidden="true">
          <span class="person-head"></span>
          <span class="person-body"></span>
          <span class="shield">✓</span>
        </div>
        <p>Uma conta <strong>gov.br</strong> garante a identificação de cada cidadão que acessa os serviços digitais do governo.</p>
        <button type="button" class="create-account ${createClass}" data-go-step="3">Crie sua conta gov.br</button>
      </section>

      <aside class="login-card">
        <h2>Acesse sua conta com</h2>
        <div class="login-method">▣ Número do CPF</div>
        <p>Caso não lembre ou possua uma conta, digite o número do seu CPF mesmo assim para verificar.</p>
        <label for="login-document">CPF</label>
        <input id="login-document" class="gov-input ${inputClass}" type="text" placeholder="Digite seu CPF" inputmode="numeric" autocomplete="off" maxlength="14" data-format="document" />
        <button type="button" class="primary-action login-submit ${buttonClass}" data-action="next">Avançar</button>
        <div class="login-options">
          <span>▣ Bancos Credenciados</span>
          <span>▣ Certificado digital</span>
          <span>▣ Certificado digital em nuvem</span>
        </div>
      </aside>
    </main>
  `, "Acesse sua conta");
}

function registrationModalPage() {
  return pageFrame(`
    <main class="login-page modal-state">
      <section class="login-intro">
        <div class="gov-illustration" aria-hidden="true">
          <span class="person-head"></span>
          <span class="person-body"></span>
          <span class="shield">✓</span>
        </div>
        <p>Uma conta <strong>gov.br</strong> garante a identificação de cada cidadão que acessa os serviços digitais do governo.</p>
        <button type="button" class="create-account" data-go-step="3">Crie sua conta gov.br</button>
      </section>
      <aside class="login-card faded">
        <h2>Acesse sua conta com</h2>
        <div class="login-method">▣ Número do CPF</div>
        <input class="gov-input" type="text" placeholder="Digite seu CPF" autocomplete="off" />
        <button type="button" class="primary-action login-submit" data-action="next">Avançar</button>
      </aside>
      <section class="registration-modal" aria-label="Opções de cadastro">
        <h2>Opções de cadastro</h2>
        <p>Selecione uma das opções e siga as orientações para criar sua conta gov.br.</p>
        <button type="button" data-select-group="registration">▣ Validação Facial no App Meu gov.br</button>
        <button type="button" data-select-group="registration">▣ Bancos Credenciados</button>
        <button type="button" data-select-group="registration">▣ Internet Banking</button>
        <button type="button" class="active-target" data-select-group="registration" data-go-step="4">▣ Número do CPF</button>
        <button type="button" data-select-group="registration">▣ Certificado digital</button>
        <button type="button" data-select-group="registration">▣ Certificado digital em nuvem</button>
        <div class="modal-footer">
          <button type="button" class="secondary-action" data-action="previous">Cancelar</button>
        </div>
      </section>
    </main>
  `, "Acesse sua conta");
}

const steps = [
  {
    titulo: "Acesse o gov.br",
    mockup: loginPage({ highlight: "create" }),
  },
  {
    titulo: "Informe o CPF",
    mockup: loginPage({ highlight: "document" }),
  },
  {
    titulo: "Inicie o cadastro",
    mockup: loginPage({ highlight: "create" }),
  },
  {
    titulo: "Escolha a opção Número do CPF",
    mockup: registrationModalPage(),
  },
  {
    titulo: "Dados cadastrais",
    mockup: accountPage(
      1,
      `
        <section class="account-form">
          <p>Preencha os campos abaixo com seus dados</p>
          <label for="register-document">CPF</label>
          <input id="register-document" class="gov-input active-target" type="text" placeholder="Digite somente números" inputmode="numeric" autocomplete="off" maxlength="14" data-format="document" />
          <label for="register-name">Nome Completo</label>
          <input id="register-name" class="gov-input" type="text" placeholder="Digite seu nome completo" autocomplete="off" />
          <label class="terms-line">
            <input type="checkbox" />
            <span>Li e estou de acordo com os <strong>Termos de uso.</strong></span>
          </label>
          <div class="captcha-box">
            <span></span>
            <strong>Não sou um robô</strong>
            <small>reCAPTCHA</small>
          </div>
        </section>
        ${actionBar()}
      `
    ),
  },
  {
    titulo: "Validar dados",
    mockup: accountPage(
      2,
      `
        <section class="validation-form">
          <p>Por questões de segurança, você deverá responder algumas perguntas para validarmos seus dados.</p>
          <div class="validation-question">
            <strong>1. Qual é o primeiro nome da sua mãe?</strong>
            <div class="answer-row">
              <button type="button" data-select-group="answer-1">JÚLIA</button>
              <button type="button" data-select-group="answer-1">SANDRA</button>
              <button type="button" class="active-target" data-select-group="answer-1">SÔNIA</button>
              <button type="button" data-select-group="answer-1">DESIRÉIA</button>
              <button type="button" data-select-group="answer-1">YASMINA</button>
              <button type="button" data-select-group="answer-1">SUSANA</button>
            </div>
          </div>
          <div class="validation-question">
            <strong>2. Qual é o dia do seu nascimento?</strong>
            <div class="answer-row">
              <button type="button" data-select-group="answer-2">20</button>
              <button type="button" data-select-group="answer-2">03</button>
              <button type="button" data-select-group="answer-2">30</button>
              <button type="button" data-select-group="answer-2">15</button>
              <button type="button" data-select-group="answer-2">28</button>
              <button type="button" data-select-group="answer-2">22</button>
              <button type="button" data-select-group="answer-2">13</button>
            </div>
          </div>
          <div class="validation-question">
            <strong>3. Qual é o seu mês de nascimento?</strong>
            <div class="answer-row">
              <button type="button" data-select-group="answer-3">NOVEMBRO</button>
              <button type="button" data-select-group="answer-3">JUNHO</button>
              <button type="button" data-select-group="answer-3">AGOSTO</button>
              <button type="button" data-select-group="answer-3">ABRIL</button>
              <button type="button" data-select-group="answer-3">JANEIRO</button>
              <button type="button" data-select-group="answer-3">MAIO</button>
              <button type="button" data-select-group="answer-3">DEZEMBRO</button>
            </div>
          </div>
        </section>
        ${actionBar()}
      `
    ),
  },
  {
    titulo: "Escolha onde receber o código",
    mockup: accountPage(
      3,
      `
        <section class="contact-form">
          <p>Para ativar sua conta, enviaremos um código para você. Como prefere recebê-lo?</p>
          <label class="contact-option" data-contact-choice="email">
            <span>▣ E-mail</span>
            <input type="radio" data-radio-group="contact" />
          </label>
          <input class="gov-input" type="email" placeholder="E-mail" autocomplete="off" data-contact-field="email" />
          <label class="contact-option" data-contact-choice="sms">
            <span>▣ SMS</span>
            <input type="radio" checked data-radio-group="contact" />
          </label>
          <input class="gov-input active-target" type="tel" placeholder="Celular para receber SMS" autocomplete="off" data-contact-field="sms" />
        </section>
        ${actionBar()}
      `
    ),
  },
  {
    titulo: "Digite o código recebido",
    mockup: accountPage(
      3,
      `
        <section class="code-form">
          <p>Um código foi enviado para <strong>usuario2021@gmail.com</strong>. Por favor, digite-o no campo abaixo.</p>
          <label for="activation-code">Código de 6 caracteres</label>
          <input id="activation-code" class="gov-input code-input active-target" type="text" placeholder="000000" inputmode="numeric" maxlength="6" autocomplete="off" />
          <a href="#">Não recebeu o código?</a>
          <a href="#">Reenviar código</a>
        </section>
        ${actionBar("Avançar", '<button type="button" class="secondary-action" data-action="previous">Voltar</button>')}
      `
    ),
  },
  {
    titulo: "Cadastre sua senha",
    mockup: accountPage(
      4,
      `
        <section class="password-form">
          <label>CPF</label>
          <strong class="document-preview">000.000.000-00</strong>
          <label for="new-secret">Nova senha</label>
          <div class="password-line">
            <input id="new-secret" class="gov-input active-target" type="password" autocomplete="off" aria-describedby="password-rules password-match" />
            <button type="button" aria-label="Mostrar senha" data-action="toggle-secret">◉</button>
          </div>
          <ul id="password-rules" class="password-rules">
            <li data-password-rule="length">A senha deve ter mínimo de 8 caracteres</li>
            <li data-password-rule="lowercase">A senha deve ter pelo menos uma letra minúscula</li>
            <li data-password-rule="uppercase">A senha deve ter pelo menos uma letra maiúscula</li>
            <li data-password-rule="number">A senha deve ter pelo menos um número</li>
            <li data-password-rule="symbol">A senha deve ter pelo menos um símbolo</li>
          </ul>
          <label for="repeat-secret">Repita a senha</label>
          <div class="password-line">
            <input id="repeat-secret" class="gov-input" type="password" placeholder="Repita a senha" autocomplete="off" aria-describedby="password-match" />
            <button type="button" aria-label="Mostrar senha" data-action="toggle-secret">◉</button>
          </div>
          <p id="password-match" class="password-match" data-password-match aria-live="polite"></p>
        </section>
        ${actionBar("Concluir")}
      `
    ),
  },
  {
    titulo: "Cadastro concluído",
    mockup: accountPage(
      4,
      `
        <section class="success-form">
          <div class="success-mark">✓</div>
          <h2>Conta criada com sucesso</h2>
          <p>Use sua conta gov.br para acessar os serviços digitais quando precisar.</p>
        </section>
        <div class="action-bar">
          <button type="button" class="primary-action active-target" data-action="reset">Rever guia</button>
        </div>
      `
    ),
  },
];

let currentStep = 0;

const titleElement = document.getElementById("step-title");
const mockupElement = document.getElementById("mockup-content");
const indicatorElement = document.getElementById("step-indicator");
const previousButton = document.getElementById("prev-step");
const nextButton = document.getElementById("next-step");

function renderStep() {
  const step = steps[currentStep];
  titleElement.textContent = step.titulo;
  mockupElement.innerHTML = step.mockup;
  indicatorElement.textContent = `Passo ${currentStep + 1} de ${steps.length}`;
  previousButton.disabled = currentStep === 0;
  nextButton.textContent = currentStep === steps.length - 1 ? "Voltar para Ferramentas" : "Próximo";
  prepareEditableMockup();
}

function setStep(stepIndex) {
  const nextStep = Math.max(0, Math.min(steps.length - 1, stepIndex));
  currentStep = nextStep;
  renderStep();
}

function formatDocument(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function prepareEditableMockup() {
  mockupElement.querySelectorAll("[data-format='document']").forEach((input) => {
    input.addEventListener("input", () => {
      input.value = formatDocument(input.value);
    });
  });

  preparePasswordValidation();
}

function getPasswordState(value) {
  return {
    length: value.length >= 8,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  };
}

function preparePasswordValidation() {
  const passwordInput = mockupElement.querySelector("#new-secret");
  const repeatInput = mockupElement.querySelector("#repeat-secret");
  if (!passwordInput || !repeatInput) return;

  const updatePasswordState = () => {
    const password = passwordInput.value;
    const repeat = repeatInput.value;
    const state = getPasswordState(password);

    mockupElement.querySelectorAll("[data-password-rule]").forEach((rule) => {
      const isValid = Boolean(state[rule.dataset.passwordRule]);
      rule.classList.toggle("ok", isValid);
    });

    const matchElement = mockupElement.querySelector("[data-password-match]");
    if (!matchElement) return;

    matchElement.classList.remove("ok", "error");
    if (!repeat) {
      matchElement.textContent = "";
      return;
    }

    const passwordsMatch = password === repeat;
    matchElement.textContent = passwordsMatch ? "As senhas conferem." : "As senhas não conferem.";
    matchElement.classList.add(passwordsMatch ? "ok" : "error");
  };

  passwordInput.addEventListener("input", updatePasswordState);
  repeatInput.addEventListener("input", updatePasswordState);
  updatePasswordState();
}

function selectGroupedOption(option) {
  const group = option.dataset.selectGroup;
  if (!group) return;

  mockupElement.querySelectorAll(`[data-select-group="${group}"]`).forEach((item) => {
    item.classList.remove("active-target");
    item.setAttribute("aria-pressed", "false");
  });

  option.classList.add("active-target");
  option.setAttribute("aria-pressed", "true");
}

function selectContactChoice(choice) {
  const selected = choice.dataset.contactChoice;
  if (!selected) return;

  mockupElement.querySelectorAll('[data-radio-group="contact"]').forEach((radio) => {
    radio.checked = radio.closest("[data-contact-choice]")?.dataset.contactChoice === selected;
  });

  mockupElement.querySelectorAll("[data-contact-field]").forEach((field) => {
    field.classList.toggle("active-target", field.dataset.contactField === selected);
  });
}

function toggleSecretVisibility(button) {
  const input = button.closest(".password-line")?.querySelector("input");
  if (!input) return;

  input.type = input.type === "password" ? "text" : "password";
  button.textContent = input.type === "password" ? "◉" : "●";
}

function handleMockupClick(event) {
  const link = event.target.closest('a[href="#"]');
  if (link) {
    event.preventDefault();
    return;
  }

  const contactChoice = event.target.closest("[data-contact-choice]");
  if (contactChoice) {
    selectContactChoice(contactChoice);
  }

  const selectable = event.target.closest("[data-select-group]");
  if (selectable) {
    selectGroupedOption(selectable);
  }

  const stepControl = event.target.closest("[data-go-step]");
  if (stepControl) {
    setStep(Number(stepControl.dataset.goStep));
    return;
  }

  const actionControl = event.target.closest("[data-action]");
  if (actionControl) {
    const action = actionControl.dataset.action;
    if (action === "next") goToNextStep();
    if (action === "previous") goToPreviousStep();
    if (action === "reset") setStep(0);
    if (action === "toggle-secret") toggleSecretVisibility(actionControl);
    return;
  }
}

function goToPreviousStep() {
  if (currentStep === 0) return;
  setStep(currentStep - 1);
}

function goToNextStep() {
  if (currentStep === steps.length - 1) {
    window.location.assign("../ferramentas/");
    return;
  }

  setStep(currentStep + 1);
}

previousButton.addEventListener("click", goToPreviousStep);
nextButton.addEventListener("click", goToNextStep);
mockupElement.addEventListener("click", handleMockupClick);

document.addEventListener("keydown", (event) => {
  const activeTag = document.activeElement?.tagName;
  if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

  if (event.key === "ArrowRight") {
    if (currentStep < steps.length - 1) goToNextStep();
  }

  if (event.key === "ArrowLeft") {
    goToPreviousStep();
  }
});

renderStep();
