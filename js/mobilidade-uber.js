const uberApp = document.getElementById("uber-app");
const uberAnnouncement = document.getElementById("uber-announcement");
const simulatorPhone = document.getElementById("simulator-phone");
const resetButton = document.getElementById("reset-simulation");
const fullscreenButton = document.getElementById("fullscreen-simulation");
const fullscreenLabel = fullscreenButton.querySelector("[data-fullscreen-label]");

function icon(name, className = "") {
  return `<svg class="ui-icon ${className}" aria-hidden="true"><use href="../../img/mobilidade/ui-icons.svg#${name}"></use></svg>`;
}

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
      duration: "12 min",
      arrival: "09:51",
      capacity: "4 lugares",
      price: "R$ 22,90",
      note: "Econômico",
      image: "../../img/mobilidade/carro-economico.svg",
    },
    {
      id: "comfort",
      name: "Comfort",
      time: "7 min",
      duration: "12 min",
      arrival: "09:54",
      capacity: "4 lugares",
      price: "R$ 28,40",
      note: "Mais conforto",
      image: "../../img/mobilidade/carro-comfort.svg",
    },
    {
      id: "prioridade",
      name: "Prioridade",
      time: "2 min",
      duration: "12 min",
      arrival: "09:49",
      capacity: "4 lugares",
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
let navigationDirection = "forward";
let swipeStart = null;

const backScreens = {
  search: "home",
  pickup: "search",
  rides: "pickup",
  summary: "rides",
  searching: "rides",
  driver: "rides",
  complete: "home",
};

function haptic(pattern = 10) {
  if (typeof navigator.vibrate === "function") navigator.vibrate(pattern);
}

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

function setScreen(screen, message = "", direction = "forward") {
  clearSearchingTimer();
  paymentOpen = false;
  toastMessage = "";
  navigationDirection = direction;
  currentScreen = screen;
  renderScreen();
  haptic(direction === "back" ? 6 : 10);
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
  navigationDirection = "soft";
  renderScreen();
  haptic([8, 30, 8]);
  announce("Simulação reiniciada. Tela inicial aberta.");
  focusPrimaryHeading();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toastMessage = message;
  uberApp.querySelector(".screen-toast")?.remove();
  const toast = document.createElement("p");
  toast.className = "screen-toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  uberApp.querySelector(".app-screen")?.append(toast);
  announce(message);
  toastTimer = window.setTimeout(() => {
    toastMessage = "";
    uberApp.querySelector(".screen-toast")?.remove();
  }, 2600);
}

function mapMarkup(extraClass = "") {
  return `
    <div class="uber-map-region ${extraClass}">
      <img src="../../img/mobilidade/mapa-uber.svg" alt="Mapa ilustrativo da rota entre a UnAPI e a Praça Ary Coelho" />
      <span class="map-car map-car-a" aria-hidden="true">${icon("car")}</span>
      <span class="map-car map-car-b" aria-hidden="true">${icon("car")}</span>
      <div class="route-overview-chip"><span><small>De</small>${selectedPickup}</span><b aria-hidden="true">→</b><span><small>Para</small>${selectedDestination.name}</span></div>
      <p class="map-caption">Mapa ilustrativo • sem navegação em tempo real</p>
    </div>
  `;
}

function renderHome() {
  return `
    <section class="app-screen uber-app-screen uber-home">
      <div class="uber-home-kicker"><span>Bom dia!</span><span class="live-location">${icon("locate", "icon-small")} UnAPI/AGEAD</span></div>
      <h1 class="app-screen-heading" data-screen-heading>Para onde você vai?</h1>
      <button type="button" class="destination-trigger" data-action="open-search">${icon("search")}<span>Para onde?</span><small>Agora</small></button>
      <div class="uber-shortcuts" aria-label="Atalhos de lugares">
        <button type="button" class="uber-shortcut" data-action="choose-destination" data-destination="Praça Ary Coelho"><span aria-hidden="true">${icon("star")}</span><strong>Praça Ary Coelho</strong><small>12 min</small></button>
        <button type="button" class="uber-shortcut" data-action="choose-destination" data-destination="Terminal Morenão"><span aria-hidden="true">${icon("map-pin")}</span><strong>Terminal Morenão</strong><small>5 min</small></button>
      </div>
      <div class="uber-home-map">
        <img src="../../img/mobilidade/mapa-uber.svg" alt="Mapa ilustrativo próximo à UnAPI e ao Centro" />
        <span class="home-location-pulse" aria-hidden="true"></span>
        <button type="button" class="map-locate-button" data-action="simulated-feature" data-feature="Centralizar mapa" aria-label="Centralizar mapa">${icon("locate")}</button>
        <p class="map-caption">Localização simulada • UnAPI/UFMS — AGEAD</p>
      </div>
      <nav class="uber-bottom-nav" aria-label="Navegação simulada do aplicativo">
        <span class="active">${icon("home")}Início</span>
        <span>${icon("grid")}Serviços</span>
        <span>${icon("clock")}Atividade</span>
        <span>${icon("user")}Conta</span>
      </nav>
    </section>
  `;
}

function destinationButton(destination) {
  return `
    <button type="button" class="app-list-button" data-action="choose-destination" data-destination="${destination.name}">
      <span class="location-icon" aria-hidden="true">${icon("map-pin")}</span>
      <span><strong>${destination.name}</strong><small>${destination.detail}</small></span>
    </button>
  `;
}

function renderSearch() {
  return `
    <section class="app-screen uber-app-screen">
      <header class="uber-topbar">
        <button type="button" class="app-icon-button" data-action="back-home" aria-label="Voltar à tela inicial">${icon("arrow-left")}</button>
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
        <button type="button" class="app-icon-button map-back" data-action="back-search" aria-label="Voltar à pesquisa">${icon("arrow-left")}</button>
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
          <p class="pickup-hint">${icon("locate", "icon-small")} Toque em um ponto para ajustar o embarque.</p>
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
      <span class="ride-main"><strong>${ride.name}</strong><span>${ride.time} • ${ride.duration}</span><small>${ride.note} • ${ride.capacity}</small></span>
      <span class="ride-side"><strong class="ride-price">${ride.price}</strong><small>${ride.arrival}</small>${selected ? '<span class="ride-selected-mark">✓</span>' : ""}</span>
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
        <button type="button" class="payment-option" data-action="select-payment" data-payment="Dinheiro"><span>${icon("banknote")} Dinheiro</span><span>${selectedPayment === "Dinheiro" ? "✓" : ""}</span></button>
        <button type="button" class="payment-option" data-action="select-payment" data-payment="Cartão •••• 1234"><span>${icon("credit-card")} Cartão •••• 1234</span><span>${selectedPayment !== "Dinheiro" ? "✓" : ""}</span></button>
        <p class="app-copy">O cartão é fictício. Nenhum dado de pagamento é solicitado.</p>
        <button type="button" class="app-button uber-secondary" data-action="close-payment">Concluído</button>
      </section>
    </div>
  `;
}

function renderRides() {
  return `
    <section class="app-screen uber-app-screen uber-map-layout">
      <div class="uber-map-region">
        <img src="../../img/mobilidade/mapa-uber.svg" alt="Mapa ilustrativo do percurso da UnAPI até a Praça Ary Coelho" />
        <button type="button" class="app-icon-button map-back" data-action="back-pickup" aria-label="Voltar ao local de partida">${icon("arrow-left")}</button>
        <span class="route-eta-chip">${icon("clock", "icon-small")} ${selectedRide.duration} até ${selectedDestination.name}</span>
      </div>
      <section class="uber-sheet">
        <span class="sheet-handle" aria-hidden="true"></span>
        <h1 data-screen-heading>Escolha uma viagem</h1>
        <div class="uber-sheet-scroll">
          <div class="ride-list">${uberScenario.rideOptions.map(rideButton).join("")}</div>
          <button type="button" class="payment-row" data-action="open-payment"><span>${selectedPayment.startsWith("Cartão") ? icon("credit-card") : icon("banknote")}<span>${selectedPayment}</span></span><b>Alterar</b></button>
          <p class="ride-disclaimer">Preços e tempos simulados.</p>
        </div>
        <button type="button" class="app-button uber-primary ride-confirm-button" data-action="review-ride"><span>Escolher ${selectedRide.name}</span><strong>${selectedRide.price}</strong></button>
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
        <button type="button" class="app-button uber-primary ride-confirm-button" data-action="confirm-ride"><span>Confirmar ${selectedRide.name}</span><strong>${selectedRide.price}</strong></button>
        <button type="button" class="app-button uber-secondary" data-action="back-rides">Alterar viagem</button>
      </section>
    </section>
  `;
}

function renderSearching() {
  searchingTimer = window.setTimeout(() => {
    if (currentScreen === "searching") setScreen("driver", "Motorista fictício encontrado. Confira os dados do veículo.");
  }, prefersReducedMotion() ? 600 : 2100);

  return `
    <section class="app-screen uber-app-screen searching-screen">
      <img class="nearby-car one" src="../../img/mobilidade/carro-economico.svg" alt="" />
      <img class="nearby-car two" src="../../img/mobilidade/carro-comfort.svg" alt="" />
      <div class="searching-card">
        <div class="searching-marker" aria-hidden="true"></div>
        <h1 data-screen-heading>Procurando um motorista próximo...</h1>
        <p class="app-copy">Conectando você a motoristas próximos</p>
        <div class="search-progress" aria-hidden="true"><span></span></div>
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
        <span class="driver-car-marker" aria-hidden="true">${icon("car")}</span>
        <span class="driver-pickup-marker" aria-hidden="true">${icon("locate")}</span>
        <p class="map-caption">Carlos está a caminho • trajeto simulado</p>
      </div>
      <section class="uber-sheet driver-sheet">
        <span class="sheet-handle" aria-hidden="true"></span>
        <p class="arrival-time"><strong>Chega em 5 min</strong><span>Embarque na Entrada da AGEAD</span></p>
        <h1 class="sr-only" data-screen-heading>Motorista encontrado</h1>
        <div class="uber-sheet-scroll">
          <div class="driver-card">
            <img class="driver-avatar" src="../../img/mobilidade/motorista-ficticio.svg" alt="Avatar ilustrado do motorista fictício Carlos" />
            <div>
              <div class="driver-name-row"><strong>${uberScenario.driver.name}</strong><span>${icon("star", "icon-small")} ${uberScenario.driver.rating}</span></div>
              <p class="driver-vehicle">${uberScenario.driver.vehicle}</p>
              <p class="driver-plate" aria-label="Placa fictícia ${uberScenario.driver.plate}">${uberScenario.driver.plate}</p>
            </div>
          </div>
          <p class="safety-reminder">${icon("shield")}<span><strong>Antes de embarcar</strong>Confira a placa, a cor e o modelo do veículo.</span></p>
          <div class="driver-actions">
            ${[["Mensagem", "message"], ["Ligar", "phone"], ["Compartilhar", "send"], ["Segurança", "shield"]].map(([label, iconName]) => `<button type="button" class="driver-action" data-action="simulated-feature" data-feature="${label}">${icon(iconName)}<span>${label}</span></button>`).join("")}
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
  uberApp.dataset.screen = currentScreen;
  const screen = uberApp.querySelector(".app-screen");
  screen?.classList.add(`app-enter-${options.transition || navigationDirection}`);
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
  if (action === "back-home") setScreen("home", "Tela inicial aberta.", "back");
  if (action === "back-search") setScreen("search", "Pesquisa de destino aberta.", "back");
  if (action === "back-pickup") setScreen("pickup", "Confirme o local de partida.", "back");
  if (action === "back-rides") setScreen("rides", "Escolha uma categoria de viagem.", "back");
  if (action === "choose-destination") {
    selectedDestination = findDestination(control.dataset.destination) || selectedDestination;
    setScreen("pickup", `${selectedDestination.name} selecionada. Confirme o local de partida.`);
  }
  if (action === "select-pickup") {
    selectedPickup = control.dataset.pickup;
    haptic(8);
    renderScreen({ transition: "soft" });
    announce(`${selectedPickup} selecionada como local de partida.`);
  }
  if (action === "confirm-pickup") setScreen("rides", "Local confirmado. Escolha uma viagem.");
  if (action === "select-ride") {
    selectedRide = uberScenario.rideOptions.find((ride) => ride.id === control.dataset.ride) || selectedRide;
    haptic(8);
    renderScreen({ transition: "soft" });
    announce(`${selectedRide.name} selecionado por ${selectedRide.price}.`);
  }
  if (action === "open-payment") {
    paymentOpen = true;
    renderScreen({ transition: "soft" });
    focusPrimaryHeading();
    announce("Escolha uma forma de pagamento fictícia.");
  }
  if (action === "close-payment") {
    paymentOpen = false;
    renderScreen({ transition: "soft" });
    window.requestAnimationFrame(() => uberApp.querySelector('[data-action="open-payment"]')?.focus());
    announce("Forma de pagamento fechada.");
  }
  if (action === "select-payment") {
    selectedPayment = control.dataset.payment;
    paymentOpen = false;
    haptic(8);
    renderScreen({ transition: "soft" });
    window.requestAnimationFrame(() => uberApp.querySelector('[data-action="open-payment"]')?.focus());
    announce(`${selectedPayment} selecionado.`);
  }
  if (action === "review-ride") setScreen("summary", "Confira o resumo da corrida simulada.");
  if (action === "confirm-ride") setScreen("searching", "Procurando um motorista fictício próximo.");
  if (action === "show-driver") setScreen("driver", "Motorista fictício encontrado. Confira nome, veículo e placa.");
  if (action === "cancel-search") setScreen("rides", "Busca cancelada. Nenhuma corrida foi solicitada.", "back");
  if (action === "simulated-feature") showToast(`${control.dataset.feature}: recurso apenas demonstrativo. Nenhuma ação real foi iniciada.`);
  if (action === "finish-training") setScreen("complete", "Treinamento concluído.");
  if (action === "reset") resetSimulation();
});

function navigateBackFromGesture() {
  if (paymentOpen) {
    paymentOpen = false;
    renderScreen({ transition: "back" });
    announce("Forma de pagamento fechada.");
    return;
  }

  const target = backScreens[currentScreen];
  if (target) setScreen(target, "Tela anterior aberta.", "back");
}

uberApp.addEventListener("pointerdown", (event) => {
  if (event.clientX > 34 || event.pointerType === "mouse" || !backScreens[currentScreen]) return;
  swipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  uberApp.setPointerCapture?.(event.pointerId);
});

uberApp.addEventListener("pointermove", (event) => {
  if (!swipeStart || swipeStart.pointerId !== event.pointerId) return;
  const dx = Math.max(0, event.clientX - swipeStart.x);
  const dy = Math.abs(event.clientY - swipeStart.y);
  if (dy > 70) return;
  const screen = uberApp.querySelector(".app-screen");
  screen?.classList.add("is-swiping");
  if (screen) screen.style.transform = `translateX(${Math.min(dx * 0.72, 96)}px)`;
});

function finishSwipe(event) {
  if (!swipeStart || swipeStart.pointerId !== event.pointerId) return;
  const dx = event.clientX - swipeStart.x;
  const dy = Math.abs(event.clientY - swipeStart.y);
  const screen = uberApp.querySelector(".app-screen");
  swipeStart = null;
  if (screen) screen.style.transform = "";
  if (dx > 82 && dy < 65) {
    haptic(8);
    navigateBackFromGesture();
  } else {
    screen?.classList.remove("is-swiping");
    screen?.classList.add("swipe-cancel");
  }
}

uberApp.addEventListener("pointerup", finishSwipe);
uberApp.addEventListener("pointercancel", finishSwipe);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !paymentOpen) return;
  paymentOpen = false;
  renderScreen({ transition: "back" });
  window.requestAnimationFrame(() => uberApp.querySelector('[data-action="open-payment"]')?.focus());
  announce("Forma de pagamento fechada.");
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
  fullscreenLabel.textContent = active ? "Sair da tela cheia" : "Abrir em tela cheia";
});

renderScreen();
