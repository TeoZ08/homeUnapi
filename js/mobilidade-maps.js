const mapsApp = document.getElementById("maps-app");
const mapsAnnouncement = document.getElementById("maps-announcement");
const simulatorPhone = document.getElementById("simulator-phone");
const resetButton = document.getElementById("reset-simulation");
const fullscreenButton = document.getElementById("fullscreen-simulation");

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
      timeline: [
        ["UnAPI/UFMS — AGEAD", "Partida às 09:35"],
        ["Caminhe 7 min até o ponto", "Saída pela AGEAD"],
        ["Av. Costa e Silva — Cidade Universitária", "Ponto de ônibus simulado"],
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
      timeline: [
        ["UnAPI/UFMS — AGEAD", "Partida às 09:35"],
        ["Caminhe 3 min até o ponto", "Entrada da Cidade Universitária"],
        ["Aguarde a linha 059", "Partida simulada às 09:50"],
        ["Embarque no ônibus 059", "Sentido Praça Ary Coelho"],
        ["14 paradas", "Percurso direto pelo Centro"],
        ["Desembarque na Av. Afonso Pena", "Chegada prevista às 10:24"],
        ["Caminhe 2 min", "Siga até a praça"],
        ["Praça Ary Coelho", "Chegada prevista às 10:26"],
      ],
    },
  ],
};

const journeySteps = [
  "Saia da AGEAD e caminhe até o ponto",
  "Aguarde no ponto da Av. Costa e Silva",
  "Embarque no ônibus 059",
  "Acompanhe as próximas paradas",
  "Desembarque e caminhe até a Praça Ary Coelho",
];

let currentScreen = "place";
let selectedMode = "car";
let selectedRoute = transitScenario.routes[0];
let journeyStep = 0;
let stopsOpen = false;
let toastMessage = "";
let toastTimer = null;

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

function setScreen(screen, message = "") {
  currentScreen = screen;
  stopsOpen = false;
  toastMessage = "";
  renderScreen();
  announce(message || `Tela ${screen} aberta.`);
  focusPrimaryHeading();
}

function resetSimulation() {
  window.clearTimeout(toastTimer);
  currentScreen = "place";
  selectedMode = "car";
  selectedRoute = transitScenario.routes[0];
  journeyStep = 0;
  stopsOpen = false;
  toastMessage = "";
  renderScreen();
  announce("Simulação reiniciada. Local pesquisado aberto.");
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
    <div class="maps-map ${extraClass}">
      <img src="../../img/mobilidade/mapa-maps.svg" alt="Mapa ilustrativo de Campo Grande entre a UnAPI e a Praça Ary Coelho" />
      <p class="maps-map-caption">Mapa ilustrativo de treinamento — não representa navegação ou horários em tempo real.</p>
    </div>
  `;
}

function renderPlace() {
  return `
    <section class="app-screen maps-app-screen maps-place-layout">
      <div class="maps-map">
        <img src="../../img/mobilidade/mapa-maps.svg" alt="Mapa ilustrativo com marcador na Praça Ary Coelho" />
        <button type="button" class="app-icon-button maps-map-control" data-action="simulated-back" aria-label="Voltar">←</button>
        <p class="maps-map-caption">Mapa ilustrativo para treinamento.</p>
      </div>
      <section class="maps-place-sheet">
        <span class="maps-sheet-handle" aria-hidden="true"></span>
        <h1 data-screen-heading>Praça Ary Coelho</h1>
        <p class="place-category">Praça pública • Centro</p>
        <button type="button" class="app-button maps-primary" data-action="open-directions">Rotas</button>
        <div class="place-actions">
          <button type="button" class="app-button maps-secondary" data-action="simulated-feature" data-feature="Salvar">Salvar</button>
          <button type="button" class="app-button maps-secondary" data-action="simulated-feature" data-feature="Compartilhar">Compartilhar</button>
        </div>
      </section>
      ${toastMessage ? `<p class="screen-toast" role="status">${toastMessage}</p>` : ""}
    </section>
  `;
}

function transportModes() {
  const modes = [
    ["car", "Carro", "▰"],
    ["transit", "Ônibus", "▣"],
    ["walk", "A pé", "♟"],
    ["bike", "Bicicleta", "○"],
    ["ride", "Aplicativo", "◆"],
  ];
  return modes
    .map(([id, label, icon]) => `
      <button type="button" class="transport-mode ${selectedMode === id ? "selected" : ""}" data-action="select-mode" data-mode="${id}" aria-pressed="${selectedMode === id}" aria-label="${label}">
        <span class="mode-icon" aria-hidden="true">${icon}</span><span>${label}</span>
      </button>
    `)
    .join("");
}

function directionsHeader(backAction = "back-place") {
  return `
    <header class="maps-directions-header">
      <button type="button" class="app-icon-button" data-action="${backAction}" aria-label="Voltar">←</button>
      <div class="maps-place-fields">
        <div class="maps-field" aria-label="Origem">${transitScenario.origin.name}</div>
        <div class="maps-field" aria-label="Destino">${transitScenario.destination.name}</div>
      </div>
      <div class="maps-direction-actions">
        <button type="button" class="app-icon-button" data-action="swap-places" aria-label="Inverter origem e destino">⇅</button>
        <button type="button" class="app-icon-button" data-action="simulated-feature" data-feature="Menu" aria-label="Mais opções">⋮</button>
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
      ${mapMarkup("directions-map")}
      ${toastMessage ? `<p class="screen-toast" role="status">${toastMessage}</p>` : ""}
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
      <span class="route-duration">${route.duration.replace(" ", "<br>")}<small>${index === 0 ? "melhor" : "opção"}</small></span>
      <span>
        ${index === 0 ? '<span class="recommended-label">Recomendada</span>' : ""}
        <span class="route-symbols">A pé › ${routeBadges(route)} › A pé</span>
        <span class="route-times">${route.departure} – ${route.arrival}</span>
        <span class="route-note">${route.note}</span>
      </span>
    </button>
  `;
}

function renderRoutes() {
  return `
    <section class="app-screen maps-app-screen maps-route-layout">
      <div class="maps-map">
        <img src="../../img/mobilidade/mapa-maps.svg" alt="Mapa ilustrativo com alternativas de ônibus" />
        <button type="button" class="app-icon-button maps-map-control" data-action="back-directions" aria-label="Voltar aos modos de transporte">←</button>
      </div>
      <section class="maps-routes-sheet">
        <span class="maps-sheet-handle" aria-hidden="true"></span>
        <h1 data-screen-heading>Rotas de transporte público</h1>
        <div class="departure-row"><span>Partida às ${transitScenario.departureTime}</span><span>Horários simulados</span></div>
        <div class="routes-scroll">${transitScenario.routes.map(routeButton).join("")}</div>
        <button type="button" class="app-button maps-primary route-details-button" data-action="open-details">Ver detalhes de ${selectedRoute.duration}</button>
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
        <button type="button" class="app-icon-button" data-action="back-routes" aria-label="Voltar às rotas">←</button>
        <h1 data-screen-heading>Detalhes da rota</h1>
        <button type="button" class="app-icon-button" data-action="simulated-feature" data-feature="Compartilhar rota" aria-label="Compartilhar rota">↗</button>
      </header>
      <div class="trip-overview">
        <strong>${selectedRoute.duration}</strong>
        <p>${selectedRoute.departure} – ${selectedRoute.arrival} • ${routeBadges(selectedRoute)}</p>
        <p>${selectedRoute.walk} • ${selectedRoute.stops}</p>
        <span class="simulated-time-notice">Horários simulados</span>
      </div>
      <div class="timeline-scroll">
        <ol class="route-timeline">${renderTimeline()}</ol>
      </div>
      <div class="details-actions">
        <button type="button" class="app-button maps-primary" data-action="start-journey">Iniciar simulação</button>
        <button type="button" class="app-button maps-secondary" data-action="simulated-feature" data-feature="Salvar rota">Salvar rota</button>
      </div>
      ${toastMessage ? `<p class="screen-toast" role="status">${toastMessage}</p>` : ""}
    </section>
  `;
}

function stopsSheet() {
  if (!stopsOpen) return "";
  return `
    <div class="stops-backdrop">
      <section class="stops-sheet" role="dialog" aria-modal="true" aria-labelledby="stops-title">
        <span class="maps-sheet-handle" aria-hidden="true"></span>
        <h2 id="stops-title" data-screen-heading>Próximas paradas simuladas</h2>
        <ul><li>Terminal Morenão</li><li>Av. Costa e Silva</li><li>Av. Afonso Pena</li><li>Praça Ary Coelho</li></ul>
        <button type="button" class="app-button maps-secondary" data-action="close-stops">Fechar</button>
      </section>
    </div>
  `;
}

function renderJourney() {
  const progress = ((journeyStep + 1) / journeySteps.length) * 100;
  const isLast = journeyStep === journeySteps.length - 1;
  return `
    <section class="app-screen maps-app-screen journey-layout">
      <div class="maps-map journey-map">
        <img src="../../img/mobilidade/mapa-maps.svg" alt="Mapa ilustrativo da viagem de ônibus em andamento" />
        <button type="button" class="app-icon-button maps-map-control" data-action="back-details" aria-label="Voltar aos detalhes">←</button>
        <span class="journey-bus step-${journeyStep}" aria-hidden="true">▣</span>
      </div>
      <section class="maps-journey-sheet">
        <span class="maps-sheet-handle" aria-hidden="true"></span>
        <p class="journey-label">Etapa ${journeyStep + 1} de ${journeySteps.length}</p>
        <div class="journey-progress" aria-label="${Math.round(progress)} por cento do percurso"><span style="width:${progress}%"></span></div>
        <h1 class="journey-next" data-screen-heading>${journeySteps[journeyStep]}</h1>
        <div class="journey-actions">
          <button type="button" class="app-button maps-secondary" data-action="open-stops">Ver próximas paradas</button>
          <button type="button" class="app-button maps-primary" data-action="next-journey">${isLast ? "Concluir viagem" : "Avançar percurso"}</button>
        </div>
      </section>
      ${stopsSheet()}
    </section>
  `;
}

function renderComplete() {
  return `
    <section class="app-screen maps-app-screen maps-complete app-scroll">
      <span class="arrival-pin" aria-hidden="true"><span>✓</span></span>
      <h1 data-screen-heading>Você chegou à Praça Ary Coelho</h1>
      <p class="app-copy">A viagem foi apenas uma simulação. Consulte sempre o aplicativo e as informações oficiais antes de sair.</p>
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
  mapsApp.innerHTML = screens[currentScreen]();
  if (!options.preserveFocus && currentScreen === "details") {
    mapsApp.querySelector(".timeline-scroll")?.scrollTo({ top: 0 });
  }
}

mapsApp.addEventListener("click", (event) => {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const { action } = control.dataset;

  if (action === "open-directions") setScreen("directions", "Origem e destino definidos. Escolha transporte público.");
  if (action === "back-place" || action === "simulated-back") setScreen("place", "Praça Ary Coelho aberta.");
  if (action === "back-directions") setScreen("directions", "Escolha um modo de transporte.");
  if (action === "back-routes") setScreen("routes", "Opções de ônibus abertas.");
  if (action === "back-details") setScreen("details", "Detalhes da rota abertos.");
  if (action === "swap-places") showToast("Origem e destino invertidos apenas de forma demonstrativa. O cenário de treinamento foi mantido.");
  if (action === "select-mode") {
    selectedMode = control.dataset.mode;
    if (selectedMode === "transit") {
      setScreen("routes", "Transporte público selecionado. Três rotas simuladas disponíveis.");
    } else {
      renderScreen();
      announce(`${control.textContent.trim()} selecionado. Para continuar o treinamento, escolha Ônibus.`);
    }
  }
  if (action === "select-route") {
    selectedRoute = transitScenario.routes.find((route) => route.id === control.dataset.route) || selectedRoute;
    renderScreen();
    announce(`Rota de ${selectedRoute.duration} selecionada. ${selectedRoute.note}.`);
  }
  if (action === "open-details") setScreen("details", `Detalhes da rota de ${selectedRoute.duration} abertos.`);
  if (action === "start-journey") {
    journeyStep = 0;
    setScreen("journey", "Viagem simulada iniciada. Avance manualmente pelas etapas.");
  }
  if (action === "open-stops") {
    stopsOpen = true;
    renderScreen();
    focusPrimaryHeading();
    announce("Próximas paradas simuladas abertas.");
  }
  if (action === "close-stops") {
    stopsOpen = false;
    renderScreen();
    announce("Lista de próximas paradas fechada.");
  }
  if (action === "next-journey") {
    if (journeyStep < journeySteps.length - 1) {
      journeyStep += 1;
      renderScreen();
      announce(`Etapa ${journeyStep + 1}: ${journeySteps[journeyStep]}.`);
      focusPrimaryHeading();
    } else {
      setScreen("complete", "Você chegou à Praça Ary Coelho. Simulação concluída.");
    }
  }
  if (action === "simulated-feature") showToast(`${control.dataset.feature}: recurso apenas demonstrativo. Nenhuma ação real foi iniciada.`);
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
