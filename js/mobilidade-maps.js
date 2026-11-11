const mapsApp = document.getElementById("maps-app");
const mapsAnnouncement = document.getElementById("maps-announcement");
const simulatorPhone = document.getElementById("simulator-phone");
const resetButton = document.getElementById("reset-simulation");
const fullscreenButton = document.getElementById("fullscreen-simulation");
const fullscreenLabel = fullscreenButton.querySelector("[data-fullscreen-label]");

const modes = {
  car: { label: "Carro", icon: "m-car" },
  walk: { label: "A pé", icon: "m-walk" },
  bike: { label: "Bicicleta", icon: "m-bike" },
  transit: { label: "Ônibus", icon: "m-bus" },
};

const transitTemplates = [
  {
    lines: [{ number: "080", name: "Centro", color: "#1967d2", textColor: "#ffffff" }],
    startWalk: 4,
    wait: 5,
    rideFactor: 1.5,
    stops: 7,
    endWalk: 3,
    fare: "R$ 4,65",
  },
  {
    lines: [
      { number: "087", name: "Terminal Centro", color: "#00897b", textColor: "#ffffff" },
      { number: "515", name: "Bairro", color: "#f9ab00", textColor: "#202124" },
    ],
    startWalk: 3,
    wait: 8,
    transferWait: 6,
    rideFactor: 1.35,
    stops: 10,
    endWalk: 4,
    fare: "R$ 4,65",
  },
  {
    lines: [{ number: "070", name: "Via Centro", color: "#d93025", textColor: "#ffffff" }],
    startWalk: 7,
    wait: 11,
    rideFactor: 1.65,
    stops: 12,
    endWalk: 2,
    fare: "R$ 4,65",
  },
];

let screen = "planner";
let origin = null;
let destination = null;
let searchTarget = "origin";
let searchResults = [];
let statusMessage = "";
let searchQuery = "";
let selectedMode = "transit";
let routeOptions = [];
let selectedRouteIndex = 0;
let journeyStep = 0;
let transitDepartureMinutes = 9 * 60 + 35;
let scheduleOpen = false;
let activeMap = null;
let mapRenderVersion = 0;
let searchController = null;
let routeController = null;

function icon(name, className = "") {
  return `<svg class="ui-icon ${className}" aria-hidden="true"><use href="../../img/mobilidade/ui-icons.svg#${name}"></use></svg>`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function announce(message) {
  mapsAnnouncement.textContent = "";
  window.setTimeout(() => { mapsAnnouncement.textContent = message; }, 30);
}

function haptic(pattern = 10) {
  if (typeof navigator.vibrate === "function") navigator.vibrate(pattern);
}

function currentRoute() {
  return routeOptions[selectedRouteIndex] || null;
}

function clockTime(totalMinutes) {
  const minutesInDay = 24 * 60;
  const normalized = ((Math.round(totalMinutes) % minutesInDay) + minutesInDay) % minutesInDay;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function lineBadge(line) {
  return `<span class="line-badge" style="--line-color:${line.color};--line-text:${line.textColor}">${escapeHtml(line.number)}</span>`;
}

function fallbackRoute() {
  const [originLat, originLng] = origin.latlng;
  const [destinationLat, destinationLng] = destination.latlng;
  const latitudeDelta = destinationLat - originLat;
  const longitudeDelta = destinationLng - originLng;
  const latitudeKm = latitudeDelta * 111.32;
  const longitudeKm = longitudeDelta * 111.32 * Math.cos(((originLat + destinationLat) / 2) * Math.PI / 180);
  const distance = Math.max(700, Math.hypot(latitudeKm, longitudeKm) * 1000);
  return {
    id: "transit-fallback",
    distance,
    duration: Math.max(420, distance / 7.5),
    geometry: [
      origin.latlng,
      [originLat + latitudeDelta * 0.34 + 0.002, originLng + longitudeDelta * 0.34],
      [originLat + latitudeDelta * 0.68 - 0.0015, originLng + longitudeDelta * 0.68],
      destination.latlng,
    ],
    steps: [],
  };
}

function createTransitSteps(route, template, departureMinutes, arrivalMinutes) {
  const roadMinutes = Math.max(8, Math.round((route.baseDuration || route.duration) / 60 * template.rideFactor));
  const firstLine = template.lines[0];
  const secondLine = template.lines[1];
  const firstBoarding = departureMinutes + template.startWalk;
  const firstDeparture = firstBoarding + template.wait;
  const firstRideMinutes = secondLine ? Math.max(7, Math.round(roadMinutes * 0.58)) : roadMinutes;
  const transferTime = firstDeparture + firstRideMinutes;
  const secondDeparture = transferTime + (template.transferWait || 0);
  const destinationTime = arrivalMinutes;

  const steps = [
    { kind: "origin", time: clockTime(departureMinutes), title: origin.name, detail: origin.detail },
    { kind: "walk", time: clockTime(departureMinutes), title: `Caminhe por ${template.startWalk} min`, detail: `${template.startWalk * 70} m`, duration: template.startWalk * 60, distance: template.startWalk * 70 },
    {
      kind: "bus",
      time: clockTime(firstDeparture),
      title: "Parada mais próxima",
      line: firstLine,
      direction: firstLine.name,
      wait: template.wait,
      nextTimes: [clockTime(firstDeparture), clockTime(firstDeparture + 12)],
      stops: secondLine ? Math.max(3, Math.floor(template.stops * 0.55)) : template.stops,
      duration: firstRideMinutes * 60,
    },
  ];

  if (secondLine) {
    steps.push(
      { kind: "transfer", time: clockTime(transferTime), title: "Terminal Centro", detail: `${template.transferWait} min para a baldeação`, duration: template.transferWait * 60 },
      {
        kind: "bus",
        time: clockTime(secondDeparture),
        title: "Terminal Centro",
        line: secondLine,
        direction: secondLine.name,
        wait: template.transferWait,
        nextTimes: [clockTime(secondDeparture), clockTime(secondDeparture + 14)],
        stops: Math.max(3, template.stops - Math.floor(template.stops * 0.55)),
        duration: Math.max(1, roadMinutes - firstRideMinutes) * 60,
      },
    );
  }

  steps.push(
    { kind: "walk", time: clockTime(destinationTime - template.endWalk), title: `Caminhe por ${template.endWalk} min`, detail: `${template.endWalk * 75} m`, duration: template.endWalk * 60, distance: template.endWalk * 75 },
    { kind: "destination", time: clockTime(destinationTime), title: destination.name, detail: destination.detail },
  );
  return steps;
}

function createTransitRoutes(baseRoutes) {
  const bases = baseRoutes.length ? baseRoutes : [fallbackRoute()];
  return transitTemplates.map((template, index) => {
    const base = bases[index % bases.length];
    const baseDuration = base.baseDuration || base.duration;
    const departureMinutes = transitDepartureMinutes + 2 + index * 4;
    const roadMinutes = Math.max(8, Math.round(baseDuration / 60 * template.rideFactor));
    const totalMinutes = template.startWalk + template.wait + roadMinutes + (template.transferWait || 0) + template.endWalk;
    const arrivalMinutes = departureMinutes + totalMinutes;
    return {
      ...base,
      id: `transit-${index}`,
      baseDuration,
      duration: totalMinutes * 60,
      transit: {
        departure: clockTime(departureMinutes),
        arrival: clockTime(arrivalMinutes),
        totalMinutes,
        lines: template.lines,
        startWalk: template.startWalk,
        endWalk: template.endWalk,
        wait: template.wait,
        fare: template.fare,
        steps: createTransitSteps(base, template, departureMinutes, arrivalMinutes),
      },
    };
  });
}

function transportModes() {
  return Object.entries(modes).map(([id, mode]) => `<button type="button" class="transport-mode ${selectedMode === id ? "selected" : ""}" data-action="select-mode" data-mode="${id}" aria-pressed="${selectedMode === id}"><span class="mode-icon">${icon(mode.icon)}</span><span>${mode.label}</span></button>`).join("");
}

function locationControl(point, target) {
  const emptyLabel = target === "origin" ? "Escolher origem" : "Escolher destino";
  return `<button type="button" class="maps-location-control ${point ? "has-value" : ""}" data-action="open-search" data-target="${target}"><span class="location-letter ${target}">${target === "origin" ? "A" : "B"}</span><span><small>${target === "origin" ? "Origem" : "Destino"}</small><strong>${escapeHtml(point?.name || emptyLabel)}</strong>${point ? `<em>${escapeHtml(point.detail)}</em>` : ""}</span>${icon("m-forward", "icon-small")}</button>`;
}

function renderPlanner() {
  return `<section class="app-screen maps-app-screen maps-custom-planner"><header class="maps-planner-title"><h1 data-screen-heading>Para onde vamos?</h1></header>
    <div class="maps-location-stack">${locationControl(origin, "origin")}${locationControl(destination, "destination")}<button class="swap-locations maps-swap" data-action="swap" aria-label="Inverter origem e destino">${icon("m-swap")}</button></div>
    <nav class="transport-modes" aria-label="Modo de transporte">${transportModes()}</nav>
    <div class="maps-planner-map"><div class="mobility-live-map" data-live-map aria-label="Mapa para selecionar pontos"></div><p class="map-helper">${origin && destination ? "Arraste A ou B para ajustar os pontos." : `Toque no mapa para marcar ${searchTarget === "origin" ? "a origem" : "o destino"}.`}</p></div>
    <div class="maps-plan-actions">${statusMessage ? `<p class="route-error" role="status">${escapeHtml(statusMessage)}</p>` : `<p class="service-note">${selectedMode === "transit" ? "Horários simulados" : "Rotas pelas ruas"}</p>`}<button class="app-button maps-primary" data-action="calculate" ${origin && destination ? "" : "disabled"}>${icon("m-directions")} Ver rotas</button></div>
  </section>`;
}

function renderSearch() {
  const title = searchTarget === "origin" ? "Escolher origem" : "Escolher destino";
  return `<section class="app-screen maps-app-screen location-search-screen"><header class="maps-details-topbar"><button class="app-icon-button" data-action="back" aria-label="Voltar">${icon("m-arrow-back")}</button><h1 data-screen-heading>${title}</h1><span></span></header>
    <form class="location-search-form maps-search-form" data-location-search><label for="maps-location-query">Nome ou endereço</label><div><input id="maps-location-query" class="app-field" type="search" minlength="3" required autocomplete="off" value="${escapeHtml(searchQuery)}" placeholder="Ex.: Rua 14 de Julho" /><button class="app-button maps-primary" type="submit">${icon("search")} Buscar</button></div><p>Busca © OpenStreetMap contributors. Não informe dados pessoais.</p></form>
    <button type="button" class="use-current-location" data-action="use-location">${icon("locate")}<span><strong>Usar minha localização</strong><small>Com sua permissão</small></span></button>
    <div class="search-map-mini"><div class="mobility-live-map" data-live-map></div><p>Ou toque no mapa para marcar o ponto.</p></div>
    <div class="destination-results app-scroll" aria-live="polite">${statusMessage ? `<p class="search-state">${escapeHtml(statusMessage)}</p>` : ""}${searchResults.map((result, index) => `<button class="app-list-button location-result" data-action="select-result" data-index="${index}" aria-label="${escapeHtml(`${result.name}, ${result.detail}`)}"><span class="location-icon">${icon("m-location")}</span><span><strong>${escapeHtml(result.name)}</strong><small>${escapeHtml(result.detail)}</small></span></button>`).join("")}</div>
  </section>`;
}

function routeCard(route, index) {
  const selected = selectedRouteIndex === index;
  if (selectedMode === "transit") return transitRouteCard(route, index, selected);
  return `<button type="button" class="selection-card transit-route ${selected ? "selected" : ""}" data-action="select-route" data-index="${index}" aria-pressed="${selected}"><span class="route-duration">${window.MobilityLocation.formatDuration(route.duration)}<small>${index === 0 ? "Recomendada" : "Alternativa"}</small></span><span class="route-main"><span class="route-symbols">${icon(modes[selectedMode].icon, "icon-small")} ${modes[selectedMode].label}</span><span class="route-times">${window.MobilityLocation.formatDistance(route.distance)}</span><span class="route-note">Trajeto calculado pela malha viária</span></span>${icon("m-forward", "route-chevron")}</button>`;
}

function transitRouteFlow(route) {
  const transit = route.transit;
  const busSegments = transit.lines.map((line) => lineBadge(line)).join('<span class="transit-flow-arrow" aria-hidden="true">›</span>');
  return `<span class="transit-flow-walk">${icon("m-walk")}<small>${transit.startWalk}</small></span><span class="transit-flow-arrow" aria-hidden="true">›</span>${busSegments}<span class="transit-flow-arrow" aria-hidden="true">›</span><span class="transit-flow-walk">${icon("m-walk")}<small>${transit.endWalk}</small></span>`;
}

function transitRouteCard(route, index, selected) {
  const transit = route.transit;
  const lineNames = transit.lines.map((line) => line.number).join(" e ");
  return `<button type="button" class="selection-card transit-route maps-transit-route ${selected ? "selected" : ""}" data-action="select-route" data-index="${index}" aria-pressed="${selected}" aria-label="${transit.departure} até ${transit.arrival}, ${transit.totalMinutes} minutos, linhas ${lineNames}">
    <span class="transit-card-time"><strong>${transit.departure} – ${transit.arrival}</strong><small>${transit.totalMinutes} min</small></span>
    <span class="transit-card-flow">${transitRouteFlow(route)}</span>
    <span class="transit-card-meta"><strong>Previsto · em ${transit.wait} min</strong><small>${transit.fare}</small></span>
    <span class="transit-route-check" aria-hidden="true">✓</span>
  </button>`;
}

function renderRoutes() {
  const route = currentRoute();
  if (selectedMode === "transit") return renderTransitRoutes(route);
  return `<section class="app-screen maps-app-screen maps-route-layout"><div class="maps-map"><div class="mobility-live-map" data-live-map aria-label="Rotas entre A e B"></div><button class="app-icon-button maps-map-control" data-action="back-planner" aria-label="Voltar">${icon("m-arrow-back")}</button><span class="map-route-chip"><strong>${window.MobilityLocation.formatDuration(route.duration)}</strong><small>${window.MobilityLocation.formatDistance(route.distance)}</small></span></div>
    <section class="maps-routes-sheet"><span class="maps-sheet-handle"></span><div class="route-sheet-heading"><div><p>${modes[selectedMode].label}</p><h1 data-screen-heading>${routeOptions.length === 1 ? "Rota encontrada" : `${routeOptions.length} rotas encontradas`}</h1></div><button class="filter-icon" data-action="edit-points">${icon("m-tune")}<span>Editar</span></button></div><div class="departure-row"><span>De ${escapeHtml(origin.name)}</span><span>até ${escapeHtml(destination.name)}</span></div><div class="routes-scroll">${routeOptions.map(routeCard).join("")}</div><button class="app-button maps-primary route-details-button" data-action="details">Ver instruções</button></section>
  </section>`;
}

function renderTransitRoutes(route) {
  const transit = route.transit;
  const departureLabel = transitDepartureMinutes === 9 * 60 + 35 ? "Saída agora" : `Saída ${clockTime(transitDepartureMinutes)}`;
  const departureOptions = [9 * 60 + 35, 10 * 60, 10 * 60 + 30];
  const scheduleMenu = scheduleOpen ? `<div class="transit-schedule-menu" role="dialog" aria-label="Horário de saída"><strong>Horário de saída</strong>${departureOptions.map((minutes, index) => `<button type="button" data-action="set-departure" data-minutes="${minutes}" aria-pressed="${transitDepartureMinutes === minutes}"><span>${index === 0 ? "Agora" : clockTime(minutes)}</span>${transitDepartureMinutes === minutes ? "✓" : ""}</button>`).join("")}</div>` : "";
  return `<section class="app-screen maps-app-screen maps-route-layout maps-transit-results"><div class="maps-map"><div class="mobility-live-map" data-live-map aria-label="Rotas de ônibus entre origem e destino"></div><button class="app-icon-button maps-map-control" data-action="back-planner" aria-label="Voltar">${icon("m-arrow-back")}</button><span class="map-route-chip transit-map-chip"><strong>${transit.totalMinutes} min</strong><small>${transit.lines.map((line) => line.number).join(" · ")}</small></span></div>
    <section class="maps-routes-sheet maps-transit-routes"><span class="maps-sheet-handle"></span><div class="route-sheet-heading"><div><h1 data-screen-heading>Transporte público</h1><button type="button" class="transit-departure-trigger" data-action="toggle-schedule" aria-expanded="${scheduleOpen}">${icon("m-schedule")}<span>${departureLabel}</span></button></div><button class="filter-icon" data-action="edit-points" aria-label="Editar origem e destino">${icon("m-tune")}</button></div>${scheduleMenu}<div class="maps-transit-endpoints"><span>${escapeHtml(origin.name)}</span>${icon("m-forward")}<span>${escapeHtml(destination.name)}</span><small>Simulado</small></div><div class="routes-scroll">${routeOptions.map(routeCard).join("")}</div><button class="app-button maps-primary route-details-button" data-action="details">Detalhes</button></section>
  </section>`;
}

function maneuverText(step, index) {
  const street = step.name ? ` em ${escapeHtml(step.name)}` : "";
  const type = step.maneuver?.type;
  const modifier = step.maneuver?.modifier;
  if (type === "depart") return `Comece${street}`;
  if (type === "arrive") return "Chegue ao ponto B";
  if (type === "roundabout" || type === "rotary") return `Entre na rotatória${street}`;
  if (type === "merge") return `Entre na via${street}`;
  if (type === "fork") return `Siga pela bifurcação${street}`;
  if (type === "turn") {
    const directions = { left: "Vire à esquerda", right: "Vire à direita", straight: "Siga em frente", "slight left": "Mantenha-se levemente à esquerda", "slight right": "Mantenha-se levemente à direita", "sharp left": "Faça uma curva fechada à esquerda", "sharp right": "Faça uma curva fechada à direita" };
    return `${directions[modifier] || "Mude de direção"}${street}`;
  }
  return index === 0 ? `Comece${street}` : `Continue${street}`;
}

function usefulSteps() {
  const steps = currentRoute()?.steps || [];
  const filtered = steps.filter((step, index) => index === 0 || index === steps.length - 1 || step.distance >= 35);
  return filtered.length ? filtered : [{ distance: currentRoute().distance, duration: currentRoute().duration, maneuver: { type: "depart" }, name: "" }, { distance: 0, duration: 0, maneuver: { type: "arrive" }, name: "" }];
}

function transitStepIcon(step) {
  const icons = { origin: "m-location", walk: "m-walk", bus: "m-bus", transfer: "m-swap", destination: "m-location" };
  return icon(icons[step.kind] || "m-location");
}

function transitStepContent(step) {
  if (step.kind === "bus") {
    return `<strong>${escapeHtml(step.title)}</strong><span class="transit-line-direction">${lineBadge(step.line)}<span>${escapeHtml(step.direction)}</span></span><span class="transit-live-time">Previsto · em ${step.wait} min</span><small>${step.stops} paradas · ${window.MobilityLocation.formatDuration(step.duration)}</small><small>Próximos: ${step.nextTimes.join(" · ")}</small>`;
  }
  if (step.kind === "walk") return `<strong>${escapeHtml(step.title)}</strong><small>${escapeHtml(step.detail)}</small>`;
  if (step.kind === "transfer") return `<strong>${escapeHtml(step.title)}</strong><small>${escapeHtml(step.detail)}</small>`;
  return `<strong>${escapeHtml(step.title)}</strong>${step.detail ? `<small>${escapeHtml(step.detail)}</small>` : ""}`;
}

function renderTransitTimeline(route) {
  return route.transit.steps.map((step) => `<li class="transit-timeline-step is-${step.kind}"><time>${step.time}</time><span class="transit-timeline-node">${transitStepIcon(step)}</span><span class="transit-step-content">${transitStepContent(step)}</span></li>`).join("");
}

function renderTransitDetails(route) {
  const transit = route.transit;
  return `<section class="app-screen maps-app-screen maps-details maps-transit-details"><header class="maps-details-topbar"><button class="app-icon-button" data-action="back-routes" aria-label="Voltar">${icon("m-arrow-back")}</button><h1 data-screen-heading>Detalhes</h1><span></span></header><div class="transit-trip-overview"><div><strong>${transit.departure} – ${transit.arrival}</strong><span>${transit.totalMinutes} min</span></div><span class="transit-overview-flow">${transitRouteFlow(route)}</span><p><span>Saída agora</span><small>Simulado</small></p></div><div class="timeline-scroll transit-timeline-scroll"><ol class="transit-timeline">${renderTransitTimeline(route)}</ol></div><div class="details-actions transit-details-actions"><button class="app-button maps-primary" data-action="start">${icon("m-navigation")} Iniciar</button></div></section>`;
}

function renderDetails() {
  const route = currentRoute();
  if (selectedMode === "transit") return renderTransitDetails(route);
  return `<section class="app-screen maps-app-screen maps-details"><header class="maps-details-topbar"><button class="app-icon-button" data-action="back-routes" aria-label="Voltar">${icon("m-arrow-back")}</button><h1 data-screen-heading>Instruções da rota</h1><span></span></header><div class="trip-overview"><div class="trip-title-row"><strong>${window.MobilityLocation.formatDuration(route.duration)}</strong><span>${modes[selectedMode].label}</span></div><p>${window.MobilityLocation.formatDistance(route.distance)} • de A até B</p><span class="schedule-notice">Estimativa sem condições de trânsito em tempo real</span></div><div class="timeline-scroll"><ol class="route-timeline">${usefulSteps().map((step, index) => `<li class="timeline-step"><strong>${maneuverText(step, index)}</strong><small>${window.MobilityLocation.formatDistance(step.distance)} • ${window.MobilityLocation.formatDuration(step.duration)}</small></li>`).join("")}</ol></div><div class="details-actions"><button class="app-button maps-primary" data-action="start">${icon("m-navigation")} Iniciar simulação</button><button class="app-button maps-secondary" data-action="back-planner">Editar rota</button></div></section>`;
}

function activeJourneySteps() {
  return selectedMode === "transit" ? currentRoute()?.transit?.steps || [] : usefulSteps();
}

function transitJourneyTitle(step) {
  if (step.kind === "origin") return escapeHtml(step.title);
  if (step.kind === "bus") return `Linha ${escapeHtml(step.line.number)} · ${escapeHtml(step.direction)}`;
  if (step.kind === "transfer") return "Faça a baldeação";
  if (step.kind === "destination") return `Chegada · ${escapeHtml(step.title)}`;
  return escapeHtml(step.title);
}

function transitJourneyDetail(step) {
  if (step.kind === "bus") return `${escapeHtml(step.title)} · em ${step.wait} min · ${step.stops} paradas`;
  return escapeHtml(step.detail || step.time);
}

function renderTransitJourney() {
  const steps = activeJourneySteps();
  const step = steps[journeyStep];
  const isLast = journeyStep === steps.length - 1;
  const lineColor = step.line?.color || "#1967d2";
  return `<section class="app-screen maps-app-screen journey-layout transit-journey-layout"><div class="maps-map journey-map"><div class="mobility-live-map" data-live-map aria-label="Mapa da viagem"></div><button class="app-icon-button maps-map-control" data-action="back-details" aria-label="Voltar">${icon("m-arrow-back")}</button><span class="journey-eta"><strong>${step.time}</strong><small>${isLast ? "chegada" : "agora"}</small></span></div><section class="maps-journey-sheet transit-journey-sheet"><span class="maps-sheet-handle"></span><div class="journey-status"><p class="journey-label">${journeyStep + 1} de ${steps.length}</p><span>${currentRoute().transit.arrival}</span></div><div class="journey-progress"><span style="width:${Math.round((journeyStep + 1) / steps.length * 100)}%"></span></div><div class="journey-instruction"><span style="--journey-color:${lineColor}">${transitStepIcon(step)}</span><div><p class="journey-next">${step.kind === "bus" ? lineBadge(step.line) : step.time}</p><h1 data-screen-heading>${transitJourneyTitle(step)}</h1><p>${transitJourneyDetail(step)}</p></div></div><div class="journey-actions"><button class="app-button maps-primary" data-action="next">${isLast ? "Concluir" : `Próxima ${icon("m-forward")}`}</button></div></section></section>`;
}

function renderJourney() {
  if (selectedMode === "transit") return renderTransitJourney();
  const steps = usefulSteps();
  const step = steps[journeyStep];
  const progress = steps.length === 1 ? 1 : journeyStep / (steps.length - 1);
  const isLast = journeyStep === steps.length - 1;
  return `<section class="app-screen maps-app-screen journey-layout"><div class="maps-map journey-map"><div class="mobility-live-map" data-live-map></div><button class="app-icon-button maps-map-control" data-action="back-details" aria-label="Voltar">${icon("m-arrow-back")}</button><span class="journey-eta"><strong>${window.MobilityLocation.formatDuration(step.duration)}</strong><small>nesta etapa</small></span></div><section class="maps-journey-sheet"><span class="maps-sheet-handle"></span><div class="journey-status"><p class="journey-label">Etapa ${journeyStep + 1} de ${steps.length}</p><span>${window.MobilityLocation.formatDistance(currentRoute().distance)}</span></div><div class="journey-progress"><span style="width:${Math.round((journeyStep + 1) / steps.length * 100)}%"></span></div><div class="journey-instruction"><span>${icon(isLast ? "m-location" : modes[selectedMode].icon)}</span><div><h1 data-screen-heading>${maneuverText(step, journeyStep)}</h1><p>${window.MobilityLocation.formatDistance(step.distance)}</p></div></div><div class="journey-actions"><button class="app-button maps-primary" data-action="next">${isLast ? "Concluir" : `Próxima etapa ${icon("m-forward")}`}</button></div></section></section>`;
}

function renderComplete() {
  if (selectedMode === "transit") return `<section class="app-screen maps-app-screen maps-complete app-scroll transit-complete"><span class="arrival-pin"><span>${icon("m-bus")}</span></span><p class="arrival-kicker">${currentRoute().transit.arrival}</p><h1 data-screen-heading>${escapeHtml(destination.name)}</h1><button class="app-button maps-primary" data-action="reset">Nova rota</button><a class="app-button maps-secondary" href="../">Mobilidade</a></section>`;
  return `<section class="app-screen maps-app-screen maps-complete app-scroll"><span class="arrival-pin"><span>${icon("m-location")}</span></span><p class="arrival-kicker">Rota simulada</p><h1 data-screen-heading>Você chegou a ${escapeHtml(destination.name)}</h1><p>O percurso usou os pontos e o modo escolhidos por você.</p><button class="app-button maps-primary" data-action="reset">Planejar outra rota</button><a class="app-button maps-secondary" href="../">Voltar para Mobilidade</a></section>`;
}

function setScreen(next, message) {
  screen = next; statusMessage = ""; render(); announce(message || "Tela atualizada."); haptic();
  window.requestAnimationFrame(() => {
    const heading = mapsApp.querySelector("[data-screen-heading]");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  });
}

function mapOptions() {
  const route = currentRoute();
  const options = { theme: "maps", origin, destination, route, alternatives: routeOptions, mode: selectedMode, permanentLabels: screen === "planner", draggable: screen === "planner" };
  if (screen === "planner" || screen === "search") options.onMapSelect = (latlng) => selectLocation(window.MobilityLocation.pointFromMap(latlng));
  if (screen === "planner") options.onLocationMove = (latlng, kind) => {
    const point = window.MobilityLocation.pointFromMap(latlng, kind === "origin" ? "Origem ajustada" : "Destino ajustado");
    if (kind === "origin") origin = point; else destination = point;
    routeOptions = []; render();
  };
  if (screen === "journey") {
    const steps = activeJourneySteps();
    options.progress = steps.length <= 1 ? 1 : journeyStep / (steps.length - 1);
  }
  return options;
}

function render() {
  const renderers = { planner: renderPlanner, search: renderSearch, routes: renderRoutes, details: renderDetails, journey: renderJourney, complete: renderComplete };
  const version = ++mapRenderVersion;
  activeMap?.stop(); activeMap?.off(); activeMap?.remove(); activeMap = null;
  mapsApp.innerHTML = renderers[screen](); mapsApp.dataset.screen = screen; document.body.dataset.mobilityScreen = screen;
  window.requestAnimationFrame(() => {
    if (version !== mapRenderVersion) return;
    const element = mapsApp.querySelector("[data-live-map]");
    if (element) activeMap = window.MobilityMap.mount(element, mapOptions());
  });
}

function selectLocation(point) {
  if (!point) return;
  const selectedTarget = searchTarget;
  if (selectedTarget === "origin") origin = point; else destination = point;
  if (selectedTarget === "origin" && !destination) searchTarget = "destination";
  routeOptions = []; searchResults = []; statusMessage = ""; searchQuery = "";
  setScreen("planner", `${point.name} definido como ${selectedTarget === "origin" ? "origem" : "destino"}.`);
}

async function searchLocations(form) {
  const query = form.querySelector("input").value.trim();
  searchQuery = query;
  searchController?.abort(); searchController = new AbortController();
  statusMessage = "Buscando locais..."; searchResults = []; render();
  try {
    searchResults = await window.MobilityLocation.search(query, { signal: searchController.signal });
    statusMessage = searchResults.length ? `${searchResults.length} locais encontrados` : "Nenhum local encontrado. Inclua bairro ou cidade.";
  } catch (error) {
    if (error.name === "AbortError") return;
    statusMessage = "A busca não respondeu. Verifique a internet e tente novamente.";
  }
  render();
}

async function calculateRoute() {
  if (!origin || !destination) return;
  routeController?.abort(); routeController = new AbortController();
  statusMessage = selectedMode === "transit" ? "Buscando horários..." : "Calculando a rota..."; render();
  try {
    if (selectedMode === "transit") {
      let baseRoutes;
      try {
        baseRoutes = await window.MobilityLocation.route(origin, destination, "car", { signal: routeController.signal });
      } catch (error) {
        if (error.name === "AbortError") return;
        baseRoutes = [fallbackRoute()];
      }
      routeOptions = createTransitRoutes(baseRoutes);
    } else {
      routeOptions = await window.MobilityLocation.route(origin, destination, selectedMode, { signal: routeController.signal });
    }
    selectedRouteIndex = 0;
    setScreen("routes", selectedMode === "transit" ? "Rotas de ônibus abertas." : "Rota calculada pelas ruas.");
  } catch (error) {
    if (error.name === "AbortError") return;
    statusMessage = `${error.message} Verifique a internet ou escolha outros pontos.`;
    render(); announce(statusMessage);
  }
}

mapsApp.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-location-search]")) return;
  event.preventDefault(); searchLocations(event.target);
});

mapsApp.addEventListener("click", (event) => {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "open-search") { searchTarget = control.dataset.target; searchResults = []; statusMessage = ""; searchQuery = ""; setScreen("search", "Digite um endereço ou marque no mapa."); }
  if (action === "back" || action === "back-planner" || action === "edit-points") setScreen("planner", "Planejador aberto.");
  if (action === "select-result") selectLocation(searchResults[Number(control.dataset.index)]);
  if (action === "use-location") navigator.geolocation?.getCurrentPosition(
    ({ coords }) => selectLocation({ id: "current", name: "Minha localização", detail: "Posição autorizada no navegador", latlng: [coords.latitude, coords.longitude] }),
    () => announce("Não foi possível obter sua localização. Pesquise ou marque no mapa."),
    { enableHighAccuracy: true, timeout: 10000 },
  );
  if (action === "swap" && origin && destination) { [origin, destination] = [destination, origin]; routeOptions = []; render(); announce("Origem e destino invertidos."); }
  if (action === "select-mode") { selectedMode = control.dataset.mode; routeOptions = []; scheduleOpen = false; render(); announce(`${modes[selectedMode].label} selecionado.`); }
  if (action === "calculate") calculateRoute();
  if (action === "toggle-schedule") { scheduleOpen = !scheduleOpen; render(); announce(scheduleOpen ? "Opções de horário abertas." : "Opções de horário fechadas."); }
  if (action === "set-departure") {
    transitDepartureMinutes = Number(control.dataset.minutes);
    scheduleOpen = false;
    routeOptions = createTransitRoutes(routeOptions);
    selectedRouteIndex = 0;
    render();
    announce(`Saída definida para ${clockTime(transitDepartureMinutes)}.`);
  }
  if (action === "select-route") { selectedRouteIndex = Number(control.dataset.index); render(); announce("Rota alternativa selecionada."); }
  if (action === "details") setScreen("details", "Instruções da rota abertas.");
  if (action === "back-routes") setScreen("routes", "Rotas abertas.");
  if (action === "start") { journeyStep = 0; setScreen("journey", "Simulação iniciada."); }
  if (action === "back-details") setScreen("details", "Instruções abertas.");
  if (action === "next") { const steps = activeJourneySteps(); if (journeyStep < steps.length - 1) { journeyStep += 1; render(); announce(`Etapa ${journeyStep + 1} de ${steps.length}.`); } else setScreen("complete", "Destino alcançado."); }
  if (action === "reset") resetSimulation();
});

let swipeStart = null;
function goBack() {
  const previous = { search: "planner", routes: "planner", details: "routes", journey: "details" }[screen];
  if (previous) setScreen(previous, "Tela anterior aberta.");
}
mapsApp.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" || event.clientX > 28 || screen === "planner") return;
  swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
});
mapsApp.addEventListener("pointerup", (event) => {
  if (!swipeStart || swipeStart.id !== event.pointerId) return;
  const deltaX = event.clientX - swipeStart.x;
  const deltaY = Math.abs(event.clientY - swipeStart.y);
  swipeStart = null;
  if (deltaX > 78 && deltaX > deltaY * 1.4) goBack();
});

function resetSimulation() {
  searchController?.abort(); routeController?.abort();
  screen = "planner"; origin = null; destination = null; searchTarget = "origin"; searchResults = []; statusMessage = ""; searchQuery = ""; selectedMode = "transit"; routeOptions = []; selectedRouteIndex = 0; journeyStep = 0; transitDepartureMinutes = 9 * 60 + 35; scheduleOpen = false;
  render(); announce("Planejador reiniciado. Escolha a origem e o destino."); haptic([8, 30, 8]);
}

resetButton.addEventListener("click", resetSimulation);
fullscreenButton.addEventListener("click", async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await simulatorPhone.requestFullscreen(); }
  catch { announce("Não foi possível alterar a tela cheia."); }
});
document.addEventListener("fullscreenchange", () => {
  const active = document.fullscreenElement === simulatorPhone;
  fullscreenButton.setAttribute("aria-pressed", String(active));
  fullscreenLabel.textContent = active ? "Sair da tela cheia" : "Abrir em tela cheia";
});

render();
