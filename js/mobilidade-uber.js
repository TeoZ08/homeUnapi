const uberApp = document.getElementById("uber-app");
const uberAnnouncement = document.getElementById("uber-announcement");
const simulatorPhone = document.getElementById("simulator-phone");
const resetButton = document.getElementById("reset-simulation");
const fullscreenButton = document.getElementById("fullscreen-simulation");

const uberScenario = {
  origin: {
    name: "UnAPI/UFMS — AGEAD",
    detail: "Setor 2, Bloco 6 — Cidade Universitária",
  },
  destinations: [
    { name: "Praça Ary Coelho", detail: "Centro — Campo Grande" },
    { name: "Shopping Campo Grande", detail: "Av. Afonso Pena" },
    { name: "Hospital Universitário — UFMS", detail: "Cidade Universitária" },
    { name: "Terminal Morenão", detail: "Av. Costa e Silva" },
    { name: "Mercadão Municipal", detail: "Centro — Campo Grande" },
  ],
  pickupPoints: [
    "Entrada da AGEAD",
    "Portaria da Cidade Universitária",
    "Terminal Morenão",
  ],
  rideOptions: [
    {
      id: "uberx",
      name: "UberX",
      time: "4 min",
      price: "R$ 22,90",
      note: "Econômico",
      image: "../../img/mobilidade/carro-economico.svg",
    },
    {
      id: "comfort",
      name: "Comfort",
      time: "7 min",
      price: "R$ 28,40",
      note: "Mais conforto",
      image: "../../img/mobilidade/carro-comfort.svg",
    },
    {
      id: "prioridade",
      name: "Prioridade",
      time: "2 min",
      price: "R$ 31,60",
      note: "Embarque mais rápido",
      image: "../../img/mobilidade/carro-prioridade.svg",
    },
  ],
  driver: {
    name: "Carlos",
    rating: "4,92",
    vehicle: "Hyundai HB20 branco",
    plate: "RTA3B21",
  },
};

let currentScreen = "home";
let selectedDestination = uberScenario.destinations[0];
let selectedPickup = uberScenario.pickupPoints[0];
let selectedRide = uberScenario.rideOptions[0];
let selectedPayment = "Dinheiro";
let paymentOpen = false;
let searchingTimer = null;
let toastTimer = null;
let toastMessage = "";

function announce(message) {
  uberAnnouncement.textContent = "";
  window.setTimeout(() => {
    uberAnnouncement.textContent = message;
  }, 30);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function focusPrimaryHeading() {
  window.requestAnimationFrame(() => {
    const heading = uberApp.querySelector("[data-screen-heading]");
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  });
}

function clearSearchingTimer() {
  if (!searchingTimer) return;
  window.clearTimeout(searchingTimer);
  searchingTimer = null;
}

function setScreen(screen, message = "") {
  clearSearchingTimer();
  paymentOpen = false;
  toastMessage = "";
  currentScreen = screen;
  renderScreen();
  announce(message || `Tela ${screen} aberta.`);
  focusPrimaryHeading();
}

function resetSimulation() {
  clearSearchingTimer();
  window.clearTimeout(toastTimer);
  currentScreen = "home";
  selectedDestination = uberScenario.destinations[0];
  selectedPickup = uberScenario.pickupPoints[0];
  selectedRide = uberScenario.rideOptions[0];
  selectedPayment = "Dinheiro";
  paymentOpen = false;
  toastMessage = "";
  renderScreen();
  announce("Simulação reiniciada. Tela inicial aberta.");
  focusPrimaryHeading();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toastMessage = message;
  renderScreen({ preserveFocus: true });
  announce(message);
  toastTimer = window.setTimeout(() => {
    toastMessage = "";
    renderScreen({ preserveFocus: true });
  }, 2600);
}

function mapMarkup(extraClass = "") {
  return `
    <div class="uber-map-region ${extraClass}">
      <img src="../../img/mobilidade/mapa-uber.svg" alt="Mapa ilustrativo da rota entre a UnAPI e a Praça Ary Coelho" />
      <p class="map-caption">Mapa ilustrativo para treinamento — não representa navegação em tempo real.</p>
    </div>
  `;
}

function renderHome() {
  return `
    <section class="app-screen uber-app-screen uber-home">
      <p class="app-copy">Bom dia!</p>
      <h1 class="app-screen-heading" data-screen-heading>Para onde você vai?</h1>
      <button type="button" class="destination-trigger" data-action="open-search">Para onde?</button>
      <div class="uber-shortcuts" aria-label="Atalhos de lugares">
        <button type="button" class="uber-shortcut" data-action="choose-destination" data-destination="Praça Ary Coelho"><span aria-hidden="true">★</span>Praça Ary Coelho</button>
        <button type="button" class="uber-shortcut" data-action="choose-destination" data-destination="Terminal Morenão"><span aria-hidden="true">⌁</span>Terminal Morenão</button>
      </div>
      <div class="uber-home-map">
        <img src="../../img/mobilidade/mapa-uber.svg" alt="Mapa ilustrativo próximo à UnAPI e ao Centro" />
        <p class="map-caption">Localização simulada: UnAPI/UFMS — AGEAD</p>
      </div>
      <nav class="uber-bottom-nav" aria-label="Navegação simulada do aplicativo">
        <span class="active"><b aria-hidden="true">●</b>Início</span>
        <span><b aria-hidden="true">▦</b>Serviços</span>
        <span><b aria-hidden="true">▤</b>Atividade</span>
        <span><b aria-hidden="true">●</b>Conta</span>
      </nav>
    </section>
  `;
}

function destinationButton(destination) {
  return `
    <button type="button" class="app-list-button" data-action="choose-destination" data-destination="${destination.name}">
      <span class="location-icon" aria-hidden="true">●</span>
      <span><strong>${destination.name}</strong><small>${destination.detail}</small></span>
    </button>
  `;
}

function renderSearch() {
  return `
    <section class="app-screen uber-app-screen">
      <header class="uber-topbar">
        <button type="button" class="app-icon-button" data-action="back-home" aria-label="Voltar à tela inicial">←</button>
        <h1 data-screen-heading>Pesquisar destino</h1>
      </header>
      <div class="uber-search-fields">
        <span class="field-markers" aria-hidden="true"><span></span></span>
        <input class="app-field" value="${uberScenario.origin.name}" readonly aria-label="Origem" />
        <input id="destination-search" class="app-field" type="search" placeholder="Digite ou escolha o destino" aria-label="Destino" autocomplete="off" />
      </div>
      <div class="destination-results app-scroll">
        <h2>Sugestões</h2>
        <div id="destination-list">${uberScenario.destinations.map(destinationButton).join("")}</div>
      </div>
    </section>
  `;
}

function renderPickup() {
  return `
    <section class="app-screen uber-app-screen uber-map-layout">
      <div class="uber-map-region">
        <img src="../../img/mobilidade/mapa-uber.svg" alt="Mapa ilustrativo dos pontos de embarque próximos à UnAPI" />
        <button type="button" class="app-icon-button map-back" data-action="back-search" aria-label="Voltar à pesquisa">←</button>
        <div class="pickup-pins" aria-label="Pontos simulados de embarque">
          ${uberScenario.pickupPoints
            .map((point) => `<button type="button" class="pickup-pin ${point === selectedPickup ? "selected" : ""}" data-action="select-pickup" data-pickup="${point}">${point}</button>`)
            .join("")}
        </div>
      </div>
      <section class="uber-sheet">
        <span class="sheet-handle" aria-hidden="true"></span>
        <h1 data-screen-heading>Confirme o local de partida</h1>
        <div class="uber-sheet-scroll">
          <p class="pickup-address"><strong>${selectedPickup}</strong><br />${uberScenario.origin.detail}</p>
          <p class="app-copy">Toque em um dos três pontos do mapa para simular o ajuste do marcador.</p>
        </div>
        <button type="button" class="app-button uber-primary" data-action="confirm-pickup">Confirmar local de partida</button>
      </section>
    </section>
  `;
}

function rideButton(ride) {
  const selected = ride.id === selectedRide.id;
  return `
    <button type="button" class="selection-card ride-option ${selected ? "selected" : ""}" data-action="select-ride" data-ride="${ride.id}" aria-pressed="${selected}">
      <img src="${ride.image}" alt="" />
      <span><strong>${ride.name}</strong><span>${ride.time}</span><small>${ride.note}</small></span>
      <span class="ride-price">${ride.price}</span>
    </button>
  `;
}

function paymentSheet() {
  if (!paymentOpen) return "";
  return `
    <div class="payment-backdrop">
      <section class="payment-sheet" role="dialog" aria-modal="true" aria-labelledby="payment-title">
        <span class="sheet-handle" aria-hidden="true"></span>
        <h2 id="payment-title" data-screen-heading>Forma de pagamento</h2>
        <button type="button" class="payment-option" data-action="select-payment" data-payment="Dinheiro">Dinheiro <span>${selectedPayment === "Dinheiro" ? "✓" : ""}</span></button>
        <button type="button" class="payment-option" data-action="select-payment" data-payment="Cartão •••• 1234">Cartão •••• 1234 <span>${selectedPayment !== "Dinheiro" ? "✓" : ""}</span></button>
        <p class="app-copy">O cartão é fictício. Nenhum dado de pagamento é solicitado.</p>
        <button type="button" class="app-button uber-secondary" data-action="close-payment">Fechar</button>
      </section>
    </div>
  `;
}

function renderRides() {
  return `
    <section class="app-screen uber-app-screen uber-map-layout">
      <div class="uber-map-region">
        <img src="../../img/mobilidade/mapa-uber.svg" alt="Mapa ilustrativo do percurso da UnAPI até a Praça Ary Coelho" />
        <button type="button" class="app-icon-button map-back" data-action="back-pickup" aria-label="Voltar ao local de partida">←</button>
      </div>
      <section class="uber-sheet">
        <span class="sheet-handle" aria-hidden="true"></span>
        <h1 data-screen-heading>Escolha uma viagem</h1>
        <div class="uber-sheet-scroll">
          <div class="ride-list">${uberScenario.rideOptions.map(rideButton).join("")}</div>
          <button type="button" class="payment-row" data-action="open-payment"><span>${selectedPayment}</span><span aria-hidden="true">›</span></button>
          <p class="app-copy">Valores simulados para treinamento.</p>
        </div>
        <button type="button" class="app-button uber-primary" data-action="review-ride">Escolher ${selectedRide.name}</button>
      </section>
      ${paymentSheet()}
    </section>
  `;
}

function summaryLines() {
  return `
    <div class="summary-list">
      <div class="summary-line"><span>Origem</span><strong>${selectedPickup}</strong></div>
      <div class="summary-line"><span>Destino</span><strong>${selectedDestination.name}</strong></div>
      <div class="summary-line"><span>Categoria</span><strong>${selectedRide.name}</strong></div>
      <div class="summary-line"><span>Preço estimado</span><strong>${selectedRide.price}</strong></div>
      <div class="summary-line"><span>Pagamento</span><strong>${selectedPayment}</strong></div>
    </div>
  `;
}

function renderSummary() {
  return `
    <section class="app-screen uber-app-screen uber-map-layout">
      ${mapMarkup()}
      <section class="uber-sheet">
        <span class="sheet-handle" aria-hidden="true"></span>
        <h1 data-screen-heading>Confira sua corrida</h1>
        <div class="uber-sheet-scroll">${summaryLines()}<p class="app-copy">Dados e valor totalmente fictícios.</p></div>
        <button type="button" class="app-button uber-primary" data-action="confirm-ride">Confirmar ${selectedRide.name}</button>
        <button type="button" class="app-button uber-secondary" data-action="back-rides">Alterar viagem</button>
      </section>
    </section>
  `;
}

function renderSearching() {
  searchingTimer = window.setTimeout(() => {
    if (currentScreen === "searching") setScreen("driver", "Motorista fictício encontrado. Confira os dados do veículo.");
  }, 1500);

  return `
    <section class="app-screen uber-app-screen searching-screen">
      <img class="nearby-car one" src="../../img/mobilidade/carro-economico.svg" alt="" />
      <img class="nearby-car two" src="../../img/mobilidade/carro-comfort.svg" alt="" />
      <div class="searching-card">
        <div class="searching-marker" aria-hidden="true"></div>
        <h1 data-screen-heading>Procurando um motorista próximo...</h1>
        <p class="app-copy">Esta busca é apenas uma transição simulada.</p>
        <button type="button" class="app-button uber-primary" data-action="show-driver">Continuar agora</button>
        <button type="button" class="app-button uber-secondary" data-action="cancel-search">Cancelar simulação</button>
      </div>
    </section>
  `;
}

function renderDriver() {
  return `
    <section class="app-screen uber-app-screen">
      <div class="uber-map-region driver-map">
        <img src="../../img/mobilidade/mapa-uber.svg" alt="Mapa ilustrativo do trajeto do motorista até a UnAPI" />
        <p class="map-caption">Trajeto do motorista simulado.</p>
      </div>
      <section class="uber-sheet driver-sheet">
        <span class="sheet-handle" aria-hidden="true"></span>
        <p class="arrival-time"><strong>Chega em 5 min</strong></p>
        <h1 class="sr-only" data-screen-heading>Motorista encontrado</h1>
        <div class="uber-sheet-scroll">
          <div class="driver-card">
            <img class="driver-avatar" src="../../img/mobilidade/motorista-ficticio.svg" alt="Avatar ilustrado do motorista fictício Carlos" />
            <div>
              <div class="driver-name-row"><strong>${uberScenario.driver.name}</strong><span>★ ${uberScenario.driver.rating}</span></div>
              <p class="driver-vehicle">${uberScenario.driver.vehicle}</p>
              <p class="driver-plate" aria-label="Placa fictícia ${uberScenario.driver.plate}">${uberScenario.driver.plate}</p>
            </div>
          </div>
          <p class="safety-reminder">Confira a placa e o veículo antes de entrar.</p>
          <div class="driver-actions">
            ${["Mensagem", "Ligar", "Compartilhar viagem", "Segurança"].map((label) => `<button type="button" class="driver-action" data-action="simulated-feature" data-feature="${label}">${label}</button>`).join("")}
          </div>
        </div>
        <button type="button" class="app-button uber-primary" data-action="finish-training">Conferi os dados</button>
      </section>
      ${toastMessage ? `<p class="screen-toast" role="status">${toastMessage}</p>` : ""}
    </section>
  `;
}

function renderComplete() {
  return `
    <section class="app-screen uber-app-screen completion-screen app-scroll">
      <span class="completion-mark" aria-hidden="true">✓</span>
      <h1 data-screen-heading>Treinamento concluído</h1>
      <p class="app-copy">Você praticou as principais conferências antes de uma corrida.</p>
      <ul class="completion-items">
        <li>Destino: ${selectedDestination.name}</li>
        <li>Categoria: ${selectedRide.name}</li>
        <li>Pagamento: ${selectedPayment}</li>
        <li>Motorista e placa ${uberScenario.driver.plate} conferidos</li>
      </ul>
      <button type="button" class="app-button uber-primary" data-action="reset">Refazer simulação</button>
      <a class="app-button uber-secondary" href="../">Voltar para Mobilidade</a>
    </section>
  `;
}

function renderScreen(options = {}) {
  const screens = {
    home: renderHome,
    search: renderSearch,
    pickup: renderPickup,
    rides: renderRides,
    summary: renderSummary,
    searching: renderSearching,
    driver: renderDriver,
    complete: renderComplete,
  };
  uberApp.innerHTML = screens[currentScreen]();
  if (!options.preserveFocus && currentScreen === "search") {
    window.requestAnimationFrame(() => document.getElementById("destination-search")?.focus());
  }
}

function findDestination(name) {
  return uberScenario.destinations.find((destination) => destination.name === name);
}

function filterDestinations(value) {
  const normalized = value.trim().toLocaleLowerCase("pt-BR");
  const matches = uberScenario.destinations.filter((destination) =>
    `${destination.name} ${destination.detail}`.toLocaleLowerCase("pt-BR").includes(normalized),
  );
  const list = document.getElementById("destination-list");
  if (!list) return;
  list.innerHTML = matches.length
    ? matches.map(destinationButton).join("")
    : '<p class="app-copy">Nenhuma sugestão encontrada. Escolha um dos locais de treinamento.</p>';
}

uberApp.addEventListener("input", (event) => {
  if (event.target.id === "destination-search") filterDestinations(event.target.value);
});

uberApp.addEventListener("click", (event) => {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const { action } = control.dataset;

  if (action === "open-search") setScreen("search", "Pesquise ou escolha um destino sugerido.");
  if (action === "back-home") setScreen("home", "Tela inicial aberta.");
  if (action === "back-search") setScreen("search", "Pesquisa de destino aberta.");
  if (action === "back-pickup") setScreen("pickup", "Confirme o local de partida.");
  if (action === "back-rides") setScreen("rides", "Escolha uma categoria de viagem.");
  if (action === "choose-destination") {
    selectedDestination = findDestination(control.dataset.destination) || selectedDestination;
    setScreen("pickup", `${selectedDestination.name} selecionada. Confirme o local de partida.`);
  }
  if (action === "select-pickup") {
    selectedPickup = control.dataset.pickup;
    renderScreen();
    announce(`${selectedPickup} selecionada como local de partida.`);
  }
  if (action === "confirm-pickup") setScreen("rides", "Local confirmado. Escolha uma viagem.");
  if (action === "select-ride") {
    selectedRide = uberScenario.rideOptions.find((ride) => ride.id === control.dataset.ride) || selectedRide;
    renderScreen();
    announce(`${selectedRide.name} selecionado por ${selectedRide.price}.`);
  }
  if (action === "open-payment") {
    paymentOpen = true;
    renderScreen();
    focusPrimaryHeading();
    announce("Escolha uma forma de pagamento fictícia.");
  }
  if (action === "close-payment") {
    paymentOpen = false;
    renderScreen();
    announce("Forma de pagamento fechada.");
  }
  if (action === "select-payment") {
    selectedPayment = control.dataset.payment;
    paymentOpen = false;
    renderScreen();
    announce(`${selectedPayment} selecionado.`);
  }
  if (action === "review-ride") setScreen("summary", "Confira o resumo da corrida simulada.");
  if (action === "confirm-ride") setScreen("searching", "Procurando um motorista fictício próximo.");
  if (action === "show-driver") setScreen("driver", "Motorista fictício encontrado. Confira nome, veículo e placa.");
  if (action === "cancel-search") setScreen("rides", "Busca cancelada. Nenhuma corrida foi solicitada.");
  if (action === "simulated-feature") showToast(`${control.dataset.feature}: recurso apenas demonstrativo. Nenhuma ação real foi iniciada.`);
  if (action === "finish-training") setScreen("complete", "Treinamento concluído.");
  if (action === "reset") resetSimulation();
});

resetButton.addEventListener("click", resetSimulation);

fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await simulatorPhone.requestFullscreen();
    }
  } catch {
    announce("Não foi possível alterar o modo de tela cheia neste navegador.");
  }
});

document.addEventListener("fullscreenchange", () => {
  const active = document.fullscreenElement === simulatorPhone;
  fullscreenButton.setAttribute("aria-pressed", String(active));
  fullscreenButton.textContent = active ? "Sair da tela cheia" : "Abrir em tela cheia";
});

renderScreen();
