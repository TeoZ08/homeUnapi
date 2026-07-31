const mapsApp = document.getElementById("maps-app");
const mapsAnnouncement = document.getElementById("maps-announcement");
const simulatorPhone = document.getElementById("simulator-phone");
const resetButton = document.getElementById("reset-simulation");
const fullscreenButton = document.getElementById("fullscreen-simulation");
const fullscreenLabel = fullscreenButton.querySelector("[data-fullscreen-label]");

function icon(name, className = "") {
  return `<svg class="ui-icon ${className}" aria-hidden="true"><use href="../../img/mobilidade/ui-icons.svg#${name}"></use></svg>`;
}

const transitScenario = {
  origin: {
    name: "UnAPI/UFMS — AGEAD",
    detail: "Setor 2, Bloco 6",
  },
  destination: {
    name: "Praça Ary Coelho",
    detail: "Praça pública — Centro",
  },
  departureTime: "09:35",
  routes: [
    {
      id: "recommended",
      duration: "38 min",
      departure: "09:42",
      arrival: "10:13",
      lines: ["059"],
      symbols: "Caminhe 7 min  ›  Ônibus  ›  Caminhe 3 min",
      note: "Sem integração • menor tempo total",
      walk: "10 min de caminhada",
      stops: "12 paradas",
      frequency: "A cada 12 min",
      crowding: "Lotação moderada",
      timeline: [
        ["UnAPI/UFMS — AGEAD", "Partida às 09:35"],
        ["Caminhe 7 min até o ponto", "Saída pela AGEAD"],
        ["Av. Costa e Silva — Cidade Universitária", "Ponto junto ao Terminal Morenão"],
        ["Embarque no ônibus 059", "059 — T. Morenão / Praça"],
        ["Sentido Praça Ary Coelho", "Partida prevista às 09:42"],
        ["12 paradas", "Terminal Morenão, Av. Costa e Silva e Centro"],
        ["Desembarque próximo à Av. Afonso Pena", "Chegada prevista às 10:10"],
        ["Caminhe 3 min", "Siga até a praça"],
        ["Praça Ary Coelho", "Chegada prevista às 10:13"],
      ],
    },
    {
      id: "integration",
      duration: "45 min",
      departure: "09:39",
      arrival: "10:20",
      lines: ["080", "059"],
      symbols: "Caminhe 4 min  ›  080  ›  059  ›  Caminhe 3 min",
      note: "Uma integração no Terminal Morenão",
      walk: "7 min de caminhada",
      stops: "15 paradas",
      frequency: "A cada 18 min",
      crowding: "Pouco movimentado",
      timeline: [
        ["UnAPI/UFMS — AGEAD", "Partida às 09:35"],
        ["Caminhe 4 min até o ponto", "Av. Costa e Silva"],
        ["Embarque no ônibus 080", "Sentido Terminal Morenão"],
        ["Integração no Terminal Morenão", "Troque para a linha 059"],
        ["Embarque no ônibus 059", "Sentido Praça Ary Coelho"],
        ["Desembarque no Centro", "Próximo à Av. Afonso Pena"],
        ["Caminhe 3 min", "Siga até a praça"],
        ["Praça Ary Coelho", "Chegada prevista às 10:20"],
      ],
    },
    {
      id: "less-walking",
      duration: "51 min",
      departure: "09:50",
      arrival: "10:26",
      lines: ["059"],
      symbols: "Caminhe 3 min  ›  Ônibus 059  ›  Caminhe 2 min",
      note: "Sem integração • maior espera • menos caminhada",
      walk: "5 min de caminhada",
      stops: "14 paradas",
      frequency: "A cada 20 min",
      crowding: "Lotação moderada",
      timeline: [
        ["UnAPI/UFMS — AGEAD", "Partida às 09:35"],
        ["Caminhe 3 min até o ponto", "Entrada da Cidade Universitária"],
        ["Aguarde a linha 059", "Partida às 09:50"],
        ["Embarque no ônibus 059", "Sentido Praça Ary Coelho"],
        ["14 paradas", "Percurso direto pelo Centro"],
        ["Desembarque na Av. Afonso Pena", "Chegada prevista às 10:24"],
        ["Caminhe 2 min", "Siga até a praça"],
        ["Praça Ary Coelho", "Chegada prevista às 10:26"],
      ],
    },
  ],
};

const journeyStepsByRoute = {
  recommended: [
    { title: "Siga em direção à saída da AGEAD", detail: "Caminhe 450 m pela via principal", eta: "7 min", icon: "m-walk" },
    { title: "Aguarde no ponto da Av. Costa e Silva", detail: "Linha 059 prevista para 09:42", eta: "5 min", icon: "m-walk" },
    { title: "Embarque no ônibus 059", detail: "Sentido Praça Ary Coelho", eta: "24 min", icon: "m-bus" },
    { title: "Continue por mais 3 paradas", detail: "Próxima: Av. Afonso Pena", eta: "8 min", icon: "m-bus" },
    { title: "Desça e caminhe até a praça", detail: "Destino a 210 m", eta: "3 min", icon: "m-walk" },
  ],
  integration: [
    { title: "Caminhe até a Av. Costa e Silva", detail: "O ponto fica a 280 m da AGEAD", eta: "4 min", icon: "m-walk" },
    { title: "Embarque no ônibus 080", detail: "Siga no sentido Terminal Morenão", eta: "8 min", icon: "m-bus" },
    { title: "Faça a integração no terminal", detail: "Desça do 080 e procure a linha 059", eta: "9 min", icon: "m-walk" },
    { title: "Embarque no ônibus 059", detail: "Continue no sentido Praça Ary Coelho", eta: "21 min", icon: "m-bus" },
    { title: "Desça e caminhe até a praça", detail: "Destino a 210 m", eta: "3 min", icon: "m-walk" },
  ],
  "less-walking": [
    { title: "Caminhe até a entrada da Cidade Universitária", detail: "O ponto fica a 190 m", eta: "3 min", icon: "m-walk" },
    { title: "Aguarde no ponto da linha 059", detail: "Partida prevista para 09:50", eta: "15 min", icon: "m-walk" },
    { title: "Embarque no ônibus 059", detail: "Siga no sentido Praça Ary Coelho", eta: "24 min", icon: "m-bus" },
    { title: "Continue até a Av. Afonso Pena", detail: "Faltam 4 paradas", eta: "7 min", icon: "m-bus" },
    { title: "Desça e caminhe até a praça", detail: "Destino a 140 m", eta: "2 min", icon: "m-walk" },
  ],
};

let currentScreen = "place";
let selectedMode = "transit";
let selectedRoute = transitScenario.routes[0];
let journeyStep = 0;
let stopsOpen = false;
let toastMessage = "";
let toastTimer = null;
let navigationDirection = "forward";
let swipeStart = null;
let activeMap = null;
let mapRenderVersion = 0;
let placesSwapped = false;
const backScreens = new Set(["directions", "routes", "details", "journey"]);

function haptic(pattern = 10) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function announce(message) {
  mapsAnnouncement.textContent = "";
  window.setTimeout(() => {
    mapsAnnouncement.textContent = message;
  }, 30);
}

function focusPrimaryHeading() {
  window.requestAnimationFrame(() => {
    const heading = mapsApp.querySelector("[data-screen-heading]");
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  });
}

function setScreen(screen, message = "", direction = "forward") {
  currentScreen = screen;
  navigationDirection = direction;
  stopsOpen = false;
  toastMessage = "";
  renderScreen();
  announce(message || `Tela ${screen} aberta.`);
  focusPrimaryHeading();
  haptic();
}

function resetSimulation() {
  window.clearTimeout(toastTimer);
  currentScreen = "place";
  selectedMode = "transit";
  selectedRoute = transitScenario.routes[0];
  journeyStep = 0;
  stopsOpen = false;
  toastMessage = "";
  navigationDirection = "soft";
  placesSwapped = false;
  renderScreen();
  announce("Local pesquisado aberto.");
  focusPrimaryHeading();
  haptic([10, 35, 10]);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toastMessage = message;
  mapsApp.querySelector(".screen-toast")?.remove();
  const toast = document.createElement("p");
  toast.className = "screen-toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  mapsApp.querySelector(".app-screen")?.append(toast);
  announce(message);
  toastTimer = window.setTimeout(() => {
    toastMessage = "";
    toast.remove();
  }, 2600);
}

function liveMapMarkup(view, route = selectedRoute.id, progress = 0) {
  return `<div class="mobility-live-map" data-live-map data-map-view="${view}" data-map-route="${route}" data-map-progress="${progress}" aria-label="Mapa interativo de Campo Grande"></div>`;
}

function mapMarkup(extraClass = "", view = "route") {
  return `
    <div class="maps-map ${extraClass}">
      ${liveMapMarkup(view)}
      <span class="map-route-chip"><strong>38 min</strong><small>via linha 059</small></span>
    </div>
  `;
}

function renderPlace() {
  return `
    <section class="app-screen maps-app-screen maps-place-layout">
      <div class="maps-map">
        ${liveMapMarkup("place")}
        <button type="button" class="app-icon-button maps-map-control" data-action="map-back" aria-label="Voltar">${icon("m-arrow-back")}</button>
      </div>
      <section class="maps-place-sheet">
        <span class="maps-sheet-handle" aria-hidden="true"></span>
        <p class="place-status"><span></span> Aberto agora · fecha às 18:00</p>
        <h1 data-screen-heading>Praça Ary Coelho</h1>
        <p class="place-category">Praça pública • Centro</p>
        <button type="button" class="app-button maps-primary maps-route-cta" data-action="open-directions">${icon("m-directions")} Rotas</button>
        <div class="place-actions">
          <button type="button" class="app-button maps-secondary" data-action="app-feature" data-feature="Local salvo">${icon("m-bookmark")} Salvar</button>
          <button type="button" class="app-button maps-secondary" data-action="app-feature" data-feature="Link da praça copiado">${icon("m-share")} Compartilhar</button>
        </div>
      </section>
    </section>
  `;
}

function transportModes() {
  const modes = [
    ["car", "Carro", "m-car"],
    ["transit", "Ônibus", "m-bus"],
    ["walk", "A pé", "m-walk"],
    ["bike", "Bicicleta", "m-bike"],
    ["ride", "Aplicativo", "m-taxi"],
  ];
  return modes
    .map(([id, label, iconName]) => `
      <button type="button" class="transport-mode ${selectedMode === id ? "selected" : ""}" data-action="select-mode" data-mode="${id}" aria-pressed="${selectedMode === id}" aria-label="${label}">
        <span class="mode-icon" aria-hidden="true">${icon(iconName)}</span><span>${label}</span>
      </button>
    `)
    .join("");
}

function directionsHeader(backAction = "back-place") {
  const origin = placesSwapped ? transitScenario.destination : transitScenario.origin;
  const destination = placesSwapped ? transitScenario.origin : transitScenario.destination;
  return `
    <header class="maps-directions-header">
      <button type="button" class="app-icon-button" data-action="${backAction}" aria-label="Voltar">${icon("m-arrow-back")}</button>
      <div class="maps-place-fields">
        <div class="maps-field" aria-label="Origem">${origin.name}</div>
        <div class="maps-field" aria-label="Destino">${destination.name}</div>
      </div>
      <div class="maps-direction-actions">
        <button type="button" class="app-icon-button" data-action="swap-places" aria-label="Inverter origem e destino">${icon("m-swap")}</button>
        <button type="button" class="app-icon-button" data-action="app-feature" data-feature="Mais opções" aria-label="Mais opções">${icon("m-more")}</button>
      </div>
    </header>
  `;
}

function renderDirections() {
  return `
    <section class="app-screen maps-app-screen">
      <h1 class="sr-only" data-screen-heading>Definir origem, destino e transporte</h1>
      ${directionsHeader()}
      <nav class="transport-modes" aria-label="Modos de transporte">${transportModes()}</nav>
      <div class="maps-filter-row" aria-label="Filtros de rota">
        <button type="button" data-action="app-feature" data-feature="Partida às 09:35">${icon("m-schedule")} Partida 09:35</button>
        <button type="button" data-action="app-feature" data-feature="Preferências de rota">${icon("m-tune")} Opções</button>
      </div>
      ${mapMarkup("directions-map", "route")}
    </section>
  `;
}

function routeBadges(route) {
  return route.lines.map((line) => `<span class="line-badge">${line}</span>`).join(" › ");
}

function routeButton(route, index) {
  const selected = route.id === selectedRoute.id;
  return `
    <button type="button" class="selection-card transit-route ${selected ? "selected" : ""}" data-action="select-route" data-route="${route.id}" aria-pressed="${selected}">
      <span class="route-duration">${route.duration}<small>${index === 0 ? "Mais rápida" : route.arrival}</small></span>
      <span class="route-main">
        ${index === 0 ? '<span class="recommended-label">Recomendada</span>' : ""}
        <span class="route-symbols">A pé › ${routeBadges(route)} › A pé</span>
        <span class="route-times">${route.departure} – ${route.arrival}</span>
        <span class="route-note">${route.note}</span>
        <span class="route-meta">${route.frequency} · ${route.crowding}</span>
      </span>
      ${icon("m-forward", "route-chevron")}
    </button>
  `;
}

function renderRoutes() {
  return `
    <section class="app-screen maps-app-screen maps-route-layout">
      <div class="maps-map">
        ${liveMapMarkup("routes", selectedRoute.id)}
        <button type="button" class="app-icon-button maps-map-control" data-action="back-directions" aria-label="Voltar aos modos de transporte">${icon("m-arrow-back")}</button>
        <span class="map-route-chip route-choice"><strong>${selectedRoute.duration}</strong><small>linha ${selectedRoute.lines.join(" + ")}</small></span>
      </div>
      <section class="maps-routes-sheet">
        <span class="maps-sheet-handle" aria-hidden="true"></span>
        <div class="route-sheet-heading"><div><p>Transporte público</p><h1 data-screen-heading>3 rotas encontradas</h1></div><button type="button" class="filter-icon" data-action="app-feature" data-feature="Filtros de rota">${icon("m-tune")}<span>Filtros</span></button></div>
        <div class="departure-row"><span>${icon("m-schedule")} Partida às ${transitScenario.departureTime}</span><span>Saída programada</span></div>
        <div class="routes-scroll">${transitScenario.routes.map(routeButton).join("")}</div>
      </section>
    </section>
  `;
}

function renderTimeline() {
  return selectedRoute.timeline
    .map(([title, detail]) => `<li class="timeline-step"><strong>${title}</strong><small>${detail}</small></li>`)
    .join("");
}

function renderDetails() {
  return `
    <section class="app-screen maps-app-screen maps-details">
      <header class="maps-details-topbar">
        <button type="button" class="app-icon-button" data-action="back-routes" aria-label="Voltar às rotas">${icon("m-arrow-back")}</button>
        <h1 data-screen-heading>Detalhes da rota</h1>
        <button type="button" class="app-icon-button" data-action="app-feature" data-feature="Rota compartilhada" aria-label="Compartilhar rota">${icon("m-share")}</button>
      </header>
      <div class="trip-overview">
        <div class="trip-title-row"><strong>${selectedRoute.duration}</strong><span>${selectedRoute.crowding}</span></div>
        <p>${selectedRoute.departure} – ${selectedRoute.arrival} • ${routeBadges(selectedRoute)}</p>
        <p>${selectedRoute.walk} • ${selectedRoute.stops} • ${selectedRoute.frequency}</p>
        <span class="schedule-notice">Saída prevista às ${selectedRoute.departure}</span>
      </div>
      <div class="timeline-scroll">
        <ol class="route-timeline">${renderTimeline()}</ol>
      </div>
      <div class="details-actions">
        <button type="button" class="app-button maps-primary" data-action="start-journey">${icon("m-navigation")} Iniciar</button>
        <button type="button" class="app-button maps-secondary" data-action="app-feature" data-feature="Rota salva">${icon("m-bookmark")} Salvar</button>
      </div>
    </section>
  `;
}

function stopsSheet() {
  if (!stopsOpen) return "";
  return `
    <div class="stops-backdrop">
      <section class="stops-sheet" role="dialog" aria-modal="true" aria-labelledby="stops-title">
        <span class="maps-sheet-handle" aria-hidden="true"></span>
        <h2 id="stops-title" data-screen-heading>Próximas paradas</h2>
        <ul><li><strong>Agora</strong> Terminal Morenão</li><li><strong>+ 6 min</strong> Av. Costa e Silva</li><li><strong>+ 18 min</strong> Av. Afonso Pena</li><li><strong>+ 24 min</strong> Praça Ary Coelho</li></ul>
        <button type="button" class="app-button maps-secondary" data-action="close-stops">${icon("m-close")} Fechar</button>
      </section>
    </div>
  `;
}

function renderJourney() {
  const journeySteps = journeyStepsByRoute[selectedRoute.id];
  const progress = ((journeyStep + 1) / journeySteps.length) * 100;
  const isLast = journeyStep === journeySteps.length - 1;
  const step = journeySteps[journeyStep];
  return `
    <section class="app-screen maps-app-screen journey-layout">
      <div class="maps-map journey-map">
        ${liveMapMarkup("journey", selectedRoute.id, progress / 100)}
        <button type="button" class="app-icon-button maps-map-control" data-action="back-details" aria-label="Voltar aos detalhes">${icon("m-arrow-back")}</button>
        <span class="journey-eta"><strong>${step.eta}</strong><small>até a próxima etapa</small></span>
      </div>
      <section class="maps-journey-sheet">
        <span class="maps-sheet-handle" aria-hidden="true"></span>
        <div class="journey-status"><p class="journey-label">Etapa ${journeyStep + 1} de ${journeySteps.length}</p><span>Chegada ${selectedRoute.arrival}</span></div>
        <div class="journey-progress" aria-label="${Math.round(progress)} por cento do percurso"><span style="width:${progress}%"></span></div>
        <div class="journey-instruction"><span aria-hidden="true">${icon(step.icon)}</span><div><h1 class="journey-next" data-screen-heading>${step.title}</h1><p>${step.detail}</p></div></div>
        <div class="journey-actions">
          <button type="button" class="app-button maps-secondary" data-action="open-stops">Ver próximas paradas</button>
          <button type="button" class="app-button maps-primary" data-action="next-journey">${isLast ? "Concluir" : `Avançar ${icon("m-forward")}`}</button>
        </div>
      </section>
      ${stopsSheet()}
    </section>
  `;
}

function renderComplete() {
  return `
    <section class="app-screen maps-app-screen maps-complete app-scroll">
      <span class="arrival-pin" aria-hidden="true"><span>${icon("m-location")}</span></span>
      <p class="arrival-kicker">${selectedRoute.arrival} · Viagem concluída</p>
      <h1 data-screen-heading>Você chegou à Praça Ary Coelho</h1>
      <p class="app-copy">Percurso concluído. Você pode consultar outra rota ou voltar para Mobilidade.</p>
      <button type="button" class="app-button maps-primary" data-action="reset">Consultar outra rota</button>
      <a class="app-button maps-secondary" href="../">Voltar para Mobilidade</a>
    </section>
  `;
}

function renderScreen(options = {}) {
  const screens = {
    place: renderPlace,
    directions: renderDirections,
    routes: renderRoutes,
    details: renderDetails,
    journey: renderJourney,
    complete: renderComplete,
  };
  const renderVersion = ++mapRenderVersion;
  activeMap?.stop();
  activeMap?.off();
  activeMap?.remove();
  activeMap = null;
  mapsApp.innerHTML = screens[currentScreen]();
  mapsApp.dataset.screen = currentScreen;
  const screen = mapsApp.querySelector(".app-screen");
  if (screen) {
    screen.classList.add(
      navigationDirection === "back"
        ? "app-enter-back"
        : navigationDirection === "soft"
          ? "app-enter-soft"
          : "app-enter-forward",
    );
  }
  if (!options.preserveFocus && currentScreen === "details") {
    mapsApp.querySelector(".timeline-scroll")?.scrollTo({ top: 0 });
  }
  window.requestAnimationFrame(() => {
    if (renderVersion !== mapRenderVersion) return;
    const mapElement = mapsApp.querySelector("[data-live-map]");
    if (!mapElement || !window.MobilityMap || mapElement._leaflet_id) return;
    activeMap = window.MobilityMap.mount(mapElement, {
      theme: "maps",
      view: mapElement.dataset.mapView,
      route: mapElement.dataset.mapRoute,
      progress: Number(mapElement.dataset.mapProgress || 0),
      destinationLabel: transitScenario.destination.name,
    });
  });
}

mapsApp.addEventListener("click", (event) => {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const { action } = control.dataset;

  if (action === "open-directions") setScreen("directions", "Origem e destino definidos. Escolha transporte público.");
  if (action === "back-place" || action === "map-back") setScreen("place", "Praça Ary Coelho aberta.", "back");
  if (action === "back-directions") setScreen("directions", "Escolha um modo de transporte.", "back");
  if (action === "back-routes") setScreen("routes", "Opções de ônibus abertas.", "back");
  if (action === "back-details") setScreen("details", "Detalhes da rota abertos.", "back");
  if (action === "swap-places") {
    placesSwapped = !placesSwapped;
    navigationDirection = "soft";
    renderScreen();
    haptic();
    announce("Origem e destino invertidos.");
  }
  if (action === "select-mode") {
    selectedMode = control.dataset.mode;
    if (selectedMode === "transit") {
      setScreen("routes", "Transporte público selecionado. Três rotas disponíveis.");
    } else {
      navigationDirection = "soft";
      renderScreen();
      haptic();
      announce(`${control.textContent.trim()} selecionado. Escolha Ônibus para consultar as linhas disponíveis.`);
    }
  }
  if (action === "select-route") {
    selectedRoute = transitScenario.routes.find((route) => route.id === control.dataset.route) || selectedRoute;
    setScreen("details", `Rota de ${selectedRoute.duration} selecionada. Detalhes abertos.`);
  }
  if (action === "open-details") setScreen("details", `Detalhes da rota de ${selectedRoute.duration} abertos.`);
  if (action === "start-journey") {
    journeyStep = 0;
    setScreen("journey", "Viagem iniciada. Avance pelas etapas do percurso.");
  }
  if (action === "open-stops") {
    stopsOpen = true;
    navigationDirection = "soft";
    renderScreen();
    focusPrimaryHeading();
    announce("Próximas paradas abertas.");
  }
  if (action === "close-stops") {
    stopsOpen = false;
    navigationDirection = "soft";
    renderScreen();
    window.requestAnimationFrame(() => mapsApp.querySelector('[data-action="open-stops"]')?.focus());
    announce("Lista de próximas paradas fechada.");
  }
  if (action === "next-journey") {
    const journeySteps = journeyStepsByRoute[selectedRoute.id];
    if (journeyStep < journeySteps.length - 1) {
      journeyStep += 1;
      navigationDirection = "soft";
      renderScreen();
      haptic();
      announce(`Etapa ${journeyStep + 1}: ${journeySteps[journeyStep].title}.`);
      focusPrimaryHeading();
    } else {
      setScreen("complete", "Você chegou à Praça Ary Coelho. Viagem concluída.");
    }
  }
  if (action === "app-feature") showToast(`${control.dataset.feature}.`);
  if (action === "reset") resetSimulation();
});

function goBackFromCurrentScreen() {
  const destinations = {
    directions: ["place", "Praça Ary Coelho aberta."],
    routes: ["directions", "Escolha um modo de transporte."],
    details: ["routes", "Opções de ônibus abertas."],
    journey: ["details", "Detalhes da rota abertos."],
  };
  const destination = destinations[currentScreen];
  if (destination) setScreen(destination[0], destination[1], "back");
}

mapsApp.addEventListener("pointerdown", (event) => {
  if (!backScreens.has(currentScreen) || event.clientX > 34 || event.pointerType === "mouse") return;
  swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  mapsApp.setPointerCapture?.(event.pointerId);
});

mapsApp.addEventListener("pointermove", (event) => {
  if (!swipeStart || swipeStart.id !== event.pointerId) return;
  const deltaX = Math.max(0, event.clientX - swipeStart.x);
  const deltaY = Math.abs(event.clientY - swipeStart.y);
  if (deltaY > deltaX && deltaY > 18) {
    swipeStart = null;
    mapsApp.classList.remove("is-swiping");
    mapsApp.querySelector(".app-screen")?.style.removeProperty("transform");
    return;
  }
  if (deltaX > 8) {
    mapsApp.classList.add("is-swiping");
    const screen = mapsApp.querySelector(".app-screen");
    if (screen) screen.style.transform = `translateX(${Math.min(deltaX * 0.62, 96)}px)`;
  }
});

function finishSwipe(event) {
  if (!swipeStart || swipeStart.id !== event.pointerId) return;
  const deltaX = event.clientX - swipeStart.x;
  const deltaY = Math.abs(event.clientY - swipeStart.y);
  const screen = mapsApp.querySelector(".app-screen");
  mapsApp.classList.remove("is-swiping");
  swipeStart = null;
  if (deltaX > 74 && deltaX > deltaY * 1.4) {
    haptic(14);
    goBackFromCurrentScreen();
  } else if (screen) {
    screen.classList.add("swipe-cancel");
    screen.style.removeProperty("transform");
  }
}

mapsApp.addEventListener("pointerup", finishSwipe);
mapsApp.addEventListener("pointercancel", finishSwipe);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !stopsOpen) return;
  stopsOpen = false;
  navigationDirection = "soft";
  renderScreen();
  window.requestAnimationFrame(() => mapsApp.querySelector('[data-action="open-stops"]')?.focus());
  announce("Lista de próximas paradas fechada.");
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
