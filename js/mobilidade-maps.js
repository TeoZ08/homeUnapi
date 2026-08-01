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
  ride: { label: "Aplicativo", icon: "m-taxi" },
};

let screen = "planner";
let origin = null;
let destination = null;
let searchTarget = "origin";
let searchResults = [];
let statusMessage = "";
let searchQuery = "";
let selectedMode = "car";
let routeOptions = [];
let selectedRouteIndex = 0;
let journeyStep = 0;
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

function transportModes() {
  return Object.entries(modes).map(([id, mode]) => `<button type="button" class="transport-mode ${selectedMode === id ? "selected" : ""}" data-action="select-mode" data-mode="${id}" aria-pressed="${selectedMode === id}"><span class="mode-icon">${icon(mode.icon)}</span><span>${mode.label}</span></button>`).join("");
}

function locationControl(point, target) {
  const emptyLabel = target === "origin" ? "Escolher origem" : "Escolher destino";
  return `<button type="button" class="maps-location-control ${point ? "has-value" : ""}" data-action="open-search" data-target="${target}"><span class="location-letter ${target}">${target === "origin" ? "A" : "B"}</span><span><small>${target === "origin" ? "Origem" : "Destino"}</small><strong>${escapeHtml(point?.name || emptyLabel)}</strong>${point ? `<em>${escapeHtml(point.detail)}</em>` : ""}</span>${icon("m-forward", "icon-small")}</button>`;
}

function renderPlanner() {
  return `<section class="app-screen maps-app-screen maps-custom-planner"><header class="maps-planner-title"><p>Planejador personalizado</p><h1 data-screen-heading>Para onde vamos?</h1></header>
    <div class="maps-location-stack">${locationControl(origin, "origin")}${locationControl(destination, "destination")}<button class="swap-locations maps-swap" data-action="swap" aria-label="Inverter origem e destino">${icon("m-swap")}</button></div>
    <nav class="transport-modes" aria-label="Modo de transporte">${transportModes()}</nav>
    <div class="maps-planner-map"><div class="mobility-live-map" data-live-map aria-label="Mapa para selecionar pontos"></div><p class="map-helper">${origin && destination ? "Arraste A ou B para ajustar os pontos." : `Toque no mapa para marcar ${searchTarget === "origin" ? "a origem" : "o destino"}.`}</p></div>
    <div class="maps-plan-actions">${statusMessage ? `<p class="route-error" role="status">${escapeHtml(statusMessage)}</p>` : '<p class="service-note">Rotas calculadas pelas ruas; requer internet.</p>'}<button class="app-button maps-primary" data-action="calculate" ${origin && destination ? "" : "disabled"}>${icon("m-directions")} Calcular rota</button></div>
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
  return `<button type="button" class="selection-card transit-route ${selected ? "selected" : ""}" data-action="select-route" data-index="${index}" aria-pressed="${selected}"><span class="route-duration">${window.MobilityLocation.formatDuration(route.duration)}<small>${index === 0 ? "Recomendada" : "Alternativa"}</small></span><span class="route-main"><span class="route-symbols">${icon(modes[selectedMode].icon, "icon-small")} ${modes[selectedMode].label}</span><span class="route-times">${window.MobilityLocation.formatDistance(route.distance)}</span><span class="route-note">Trajeto calculado pela malha viária</span></span>${icon("m-forward", "route-chevron")}</button>`;
}

function renderRoutes() {
  const route = currentRoute();
  return `<section class="app-screen maps-app-screen maps-route-layout"><div class="maps-map"><div class="mobility-live-map" data-live-map aria-label="Rotas entre A e B"></div><button class="app-icon-button maps-map-control" data-action="back-planner" aria-label="Voltar">${icon("m-arrow-back")}</button><span class="map-route-chip"><strong>${window.MobilityLocation.formatDuration(route.duration)}</strong><small>${window.MobilityLocation.formatDistance(route.distance)}</small></span></div>
    <section class="maps-routes-sheet"><span class="maps-sheet-handle"></span><div class="route-sheet-heading"><div><p>${modes[selectedMode].label}</p><h1 data-screen-heading>${routeOptions.length === 1 ? "Rota encontrada" : `${routeOptions.length} rotas encontradas`}</h1></div><button class="filter-icon" data-action="edit-points">${icon("m-tune")}<span>Editar</span></button></div><div class="departure-row"><span>De ${escapeHtml(origin.name)}</span><span>até ${escapeHtml(destination.name)}</span></div><div class="routes-scroll">${routeOptions.map(routeCard).join("")}</div><button class="app-button maps-primary route-details-button" data-action="details">Ver instruções</button></section>
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

function renderDetails() {
  const route = currentRoute();
  return `<section class="app-screen maps-app-screen maps-details"><header class="maps-details-topbar"><button class="app-icon-button" data-action="back-routes" aria-label="Voltar">${icon("m-arrow-back")}</button><h1 data-screen-heading>Instruções da rota</h1><span></span></header><div class="trip-overview"><div class="trip-title-row"><strong>${window.MobilityLocation.formatDuration(route.duration)}</strong><span>${modes[selectedMode].label}</span></div><p>${window.MobilityLocation.formatDistance(route.distance)} • de A até B</p><span class="schedule-notice">Estimativa sem condições de trânsito em tempo real</span></div><div class="timeline-scroll"><ol class="route-timeline">${usefulSteps().map((step, index) => `<li class="timeline-step"><strong>${maneuverText(step, index)}</strong><small>${window.MobilityLocation.formatDistance(step.distance)} • ${window.MobilityLocation.formatDuration(step.duration)}</small></li>`).join("")}</ol></div><div class="details-actions"><button class="app-button maps-primary" data-action="start">${icon("m-navigation")} Iniciar simulação</button><button class="app-button maps-secondary" data-action="back-planner">Editar rota</button></div></section>`;
}

function renderJourney() {
  const steps = usefulSteps();
  const step = steps[journeyStep];
  const progress = steps.length === 1 ? 1 : journeyStep / (steps.length - 1);
  const isLast = journeyStep === steps.length - 1;
  return `<section class="app-screen maps-app-screen journey-layout"><div class="maps-map journey-map"><div class="mobility-live-map" data-live-map></div><button class="app-icon-button maps-map-control" data-action="back-details" aria-label="Voltar">${icon("m-arrow-back")}</button><span class="journey-eta"><strong>${window.MobilityLocation.formatDuration(step.duration)}</strong><small>nesta etapa</small></span></div><section class="maps-journey-sheet"><span class="maps-sheet-handle"></span><div class="journey-status"><p class="journey-label">Etapa ${journeyStep + 1} de ${steps.length}</p><span>${window.MobilityLocation.formatDistance(currentRoute().distance)}</span></div><div class="journey-progress"><span style="width:${Math.round((journeyStep + 1) / steps.length * 100)}%"></span></div><div class="journey-instruction"><span>${icon(isLast ? "m-location" : modes[selectedMode].icon)}</span><div><h1 data-screen-heading>${maneuverText(step, journeyStep)}</h1><p>${window.MobilityLocation.formatDistance(step.distance)}</p></div></div><div class="journey-actions"><button class="app-button maps-primary" data-action="next">${isLast ? "Concluir" : `Próxima etapa ${icon("m-forward")}`}</button></div></section></section>`;
}

function renderComplete() {
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
  if (screen === "journey") options.progress = usefulSteps().length === 1 ? 1 : journeyStep / (usefulSteps().length - 1);
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
  statusMessage = "Calculando a rota..."; render();
  try {
    routeOptions = await window.MobilityLocation.route(origin, destination, selectedMode, { signal: routeController.signal });
    selectedRouteIndex = 0;
    setScreen("routes", "Rota calculada pelas ruas.");
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
  if (action === "select-mode") { selectedMode = control.dataset.mode; routeOptions = []; render(); announce(`${modes[selectedMode].label} selecionado.`); }
  if (action === "calculate") calculateRoute();
  if (action === "select-route") { selectedRouteIndex = Number(control.dataset.index); render(); announce("Rota alternativa selecionada."); }
  if (action === "details") setScreen("details", "Instruções da rota abertas.");
  if (action === "back-routes") setScreen("routes", "Rotas abertas.");
  if (action === "start") { journeyStep = 0; setScreen("journey", "Simulação iniciada."); }
  if (action === "back-details") setScreen("details", "Instruções abertas.");
  if (action === "next") { const steps = usefulSteps(); if (journeyStep < steps.length - 1) { journeyStep += 1; render(); announce(`Etapa ${journeyStep + 1} de ${steps.length}.`); } else setScreen("complete", "Destino alcançado."); }
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
  screen = "planner"; origin = null; destination = null; searchTarget = "origin"; searchResults = []; statusMessage = ""; searchQuery = ""; selectedMode = "car"; routeOptions = []; selectedRouteIndex = 0; journeyStep = 0;
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
