const uberApp = document.getElementById("uber-app");
const uberAnnouncement = document.getElementById("uber-announcement");
const simulatorPhone = document.getElementById("simulator-phone");
const resetButton = document.getElementById("reset-simulation");
const fullscreenButton = document.getElementById("fullscreen-simulation");
const fullscreenLabel = fullscreenButton.querySelector("[data-fullscreen-label]");

const rideOptions = [
  { id: "economico", name: "Econômico", wait: 4, factor: 1, note: "Menor preço", image: "../../img/mobilidade/carro-economico.svg" },
  { id: "comfort", name: "Comfort", wait: 7, factor: 1.24, note: "Mais conforto", image: "../../img/mobilidade/carro-comfort.svg" },
  { id: "prioridade", name: "Prioridade", wait: 2, factor: 1.38, note: "Embarque mais rápido", image: "../../img/mobilidade/carro-prioridade.svg" },
];
const driver = { name: "Carlos", rating: "4,92", vehicle: "Hyundai HB20 branco", plate: "RTA3B21" };

let screen = "planner";
let searchTarget = "destination";
let origin = null;
let destination = null;
let searchResults = [];
let searchStatus = "";
let searchQuery = "";
let plannerStatus = "";
let routeOptions = [];
let selectedRouteIndex = 0;
let selectedRide = rideOptions[0];
let payment = "Dinheiro";
let paymentOpen = false;
let activeMap = null;
let searchController = null;
let routeController = null;
let searchingTimer = null;
let mapRenderVersion = 0;

function icon(name, className = "") {
  return `<svg class="ui-icon ${className}" aria-hidden="true"><use href="../../img/mobilidade/ui-icons.svg#${name}"></use></svg>`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function announce(message) {
  uberAnnouncement.textContent = "";
  window.setTimeout(() => { uberAnnouncement.textContent = message; }, 30);
}

function haptic(pattern = 10) {
  if (typeof navigator.vibrate === "function") navigator.vibrate(pattern);
}

function currentRoute() {
  return routeOptions[selectedRouteIndex] || null;
}

function locationField(point, target) {
  const label = target === "origin" ? "Partida" : "Destino";
  return `<button type="button" class="mobility-location-field ${point ? "has-value" : ""}" data-action="open-search" data-target="${target}">
    <span class="location-letter ${target}">${target === "origin" ? "A" : "B"}</span>
    <span><small>${label}</small><strong>${escapeHtml(point?.name || `Escolher ${label.toLocaleLowerCase("pt-BR")}`)}</strong>${point ? `<em>${escapeHtml(point.detail)}</em>` : ""}</span>
    ${icon("m-forward", "icon-small")}
  </button>`;
}

function renderPlanner() {
  return `<section class="app-screen uber-app-screen mobility-planner-screen">
    <header class="planner-heading"><p>Corrida personalizada</p><h1 data-screen-heading>Escolha os dois pontos</h1></header>
    <div class="location-field-stack">
      ${locationField(origin, "origin")}
      ${locationField(destination, "destination")}
      <button class="swap-locations" type="button" data-action="swap" aria-label="Inverter partida e destino">${icon("m-swap")}</button>
    </div>
    <div class="planner-map-wrap">
      <div class="mobility-live-map" data-live-map aria-label="Mapa para escolher partida e destino"></div>
      <p class="map-helper">${origin && destination ? "Arraste A ou B para ajustar com precisão." : `Toque no mapa para escolher ${searchTarget === "origin" ? "a partida" : "o destino"}.`}</p>
    </div>
    <div class="planner-actions">
      <p class="${plannerStatus ? "route-error" : "service-note"}" role="status">${escapeHtml(plannerStatus || "Busca de endereços e rota dependem de internet.")}</p>
      <button class="app-button uber-primary" type="button" data-action="calculate" ${origin && destination ? "" : "disabled"}>Ver opções de corrida</button>
    </div>
  </section>`;
}

function resultButton(result, index) {
  return `<button type="button" class="app-list-button location-result" data-action="select-result" data-index="${index}" aria-label="${escapeHtml(`${result.name}, ${result.detail}`)}">
    <span class="location-icon">${icon("map-pin")}</span>
    <span><strong>${escapeHtml(result.name)}</strong><small>${escapeHtml(result.detail)}</small></span>
  </button>`;
}

function renderSearch() {
  const title = searchTarget === "origin" ? "Escolher partida" : "Escolher destino";
  return `<section class="app-screen uber-app-screen location-search-screen">
    <header class="uber-topbar"><button type="button" class="app-icon-button" data-action="back" aria-label="Voltar">${icon("arrow-left")}</button><h1 data-screen-heading>${title}</h1></header>
    <form class="location-search-form" data-location-search>
      <label for="location-query">Digite o nome ou endereço</label>
      <div><input id="location-query" class="app-field" type="search" minlength="3" required autocomplete="off" value="${escapeHtml(searchQuery)}" placeholder="Ex.: Parque das Nações Indígenas" /><button class="app-button uber-primary" type="submit">${icon("search")} Buscar</button></div>
      <p>Pressione Buscar após digitar. Busca © OpenStreetMap contributors. Não informe dados pessoais.</p>
    </form>
    <button type="button" class="use-current-location" data-action="use-location">${icon("locate")}<span><strong>Usar minha localização</strong><small>O navegador pedirá sua permissão</small></span></button>
    <div class="search-map-mini"><div class="mobility-live-map" data-live-map aria-label="Mapa para marcar um ponto"></div><p>Ou toque diretamente no mapa.</p></div>
    <div class="destination-results app-scroll" aria-live="polite">
      ${searchStatus ? `<p class="search-state">${escapeHtml(searchStatus)}</p>` : ""}
      ${searchResults.map(resultButton).join("")}
    </div>
  </section>`;
}

function estimatePrice(ride) {
  const route = currentRoute();
  if (!route) return "—";
  const base = 6.5 + route.distance / 1000 * 2.55 + route.duration / 60 * 0.28;
  return (base * ride.factor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function rideButton(ride) {
  const selected = ride.id === selectedRide.id;
  return `<button type="button" class="selection-card ride-option ${selected ? "selected" : ""}" data-action="select-ride" data-ride="${ride.id}" aria-pressed="${selected}">
    <img src="${ride.image}" alt="" /><span class="ride-main"><strong>${ride.name}</strong><span>${ride.wait} min para embarque</span><small>${ride.note} • até 4 lugares</small></span>
    <span class="ride-side"><strong class="ride-price">${estimatePrice(ride)}</strong><small>estimativa</small>${selected ? '<span class="ride-selected-mark">✓</span>' : ""}</span>
  </button>`;
}

function paymentSheet() {
  if (!paymentOpen) return "";
  return `<div class="payment-backdrop"><section class="payment-sheet" role="dialog" aria-modal="true" aria-labelledby="payment-title">
    <span class="sheet-handle"></span><h2 id="payment-title" data-screen-heading>Forma de pagamento</h2>
    ${["Dinheiro", "Cartão •••• 1234"].map((item) => `<button type="button" class="payment-option" data-action="payment" data-payment="${item}"><span>${icon(item === "Dinheiro" ? "banknote" : "credit-card")} ${item}</span><span>${payment === item ? "✓" : ""}</span></button>`).join("")}
    <button type="button" class="app-button uber-secondary" data-action="close-payment">Concluído</button>
  </section></div>`;
}

function renderRides() {
  const route = currentRoute();
  return `<section class="app-screen uber-app-screen uber-map-layout">
    <div class="uber-map-region"><div class="mobility-live-map" data-live-map aria-label="Rota de A até B"></div><button type="button" class="app-icon-button map-back" data-action="back-planner" aria-label="Voltar">${icon("arrow-left")}</button><span class="route-eta-chip">${icon("clock", "icon-small")} ${window.MobilityLocation.formatDuration(route.duration)} • ${window.MobilityLocation.formatDistance(route.distance)}</span></div>
    <section class="uber-sheet"><span class="sheet-handle"></span><h1 data-screen-heading>Escolha uma corrida</h1><p class="pickup-hint">${icon("map-pin", "icon-small")} Arraste A no mapa para ajustar o embarque.</p>
      <div class="uber-sheet-scroll"><div class="ride-list">${rideOptions.map(rideButton).join("")}</div><button type="button" class="payment-row" data-action="open-payment"><span>${payment.startsWith("Cartão") ? icon("credit-card") : icon("banknote")}<span>${payment}</span></span><b>Alterar</b></button></div>
      <button type="button" class="app-button uber-primary ride-confirm-button" data-action="review"><span>Escolher ${selectedRide.name}</span><strong>${estimatePrice(selectedRide)}</strong></button>
    </section>${paymentSheet()}
  </section>`;
}

function renderSummary() {
  const route = currentRoute();
  return `<section class="app-screen uber-app-screen uber-map-layout"><div class="uber-map-region"><div class="mobility-live-map" data-live-map></div></div>
    <section class="uber-sheet"><span class="sheet-handle"></span><h1 data-screen-heading>Confira sua corrida</h1><div class="uber-sheet-scroll"><div class="summary-list">
      <div class="summary-line"><span>Partida</span><strong>${escapeHtml(origin.name)}</strong></div><div class="summary-line"><span>Destino</span><strong>${escapeHtml(destination.name)}</strong></div>
      <div class="summary-line"><span>Percurso</span><strong>${window.MobilityLocation.formatDistance(route.distance)} • ${window.MobilityLocation.formatDuration(route.duration)}</strong></div><div class="summary-line"><span>Categoria</span><strong>${selectedRide.name}</strong></div><div class="summary-line"><span>Preço estimado</span><strong>${estimatePrice(selectedRide)}</strong></div>
    </div><p class="estimate-disclaimer">Estimativa educativa calculada pela distância e pelo tempo da rota; não é uma cotação real.</p></div>
    <button type="button" class="app-button uber-primary" data-action="confirm">Confirmar simulação</button><button type="button" class="app-button uber-secondary" data-action="back-rides">Alterar</button></section></section>`;
}

function renderSearching() {
  searchingTimer = window.setTimeout(() => screen === "searching" && setScreen("driver", "Motorista fictício encontrado."), 1800);
  return `<section class="app-screen uber-app-screen searching-screen"><div class="mobility-live-map searching-live-map" data-live-map></div><div class="searching-card"><div class="searching-marker"></div><h1 data-screen-heading>Procurando um motorista próximo...</h1><p>Esta etapa é uma simulação educativa.</p><div class="search-progress"><span></span></div><button class="app-button uber-primary" data-action="show-driver">Continuar agora</button><button class="app-button uber-secondary" data-action="cancel">Cancelar</button></div></section>`;
}

function renderDriver() {
  return `<section class="app-screen uber-app-screen uber-map-layout"><div class="uber-map-region driver-map"><div class="mobility-live-map" data-live-map></div></div><section class="uber-sheet driver-sheet"><span class="sheet-handle"></span><p class="arrival-time"><strong>Chega em ${selectedRide.wait} min</strong><span>Embarque no ponto A escolhido</span></p><h1 class="sr-only" data-screen-heading>Motorista encontrado</h1><div class="uber-sheet-scroll"><div class="driver-card"><img class="driver-avatar" src="../../img/mobilidade/motorista-ficticio.svg" alt="Avatar fictício do motorista Carlos" /><div><div class="driver-name-row"><strong>${driver.name}</strong><span>${icon("star", "icon-small")} ${driver.rating}</span></div><p class="driver-vehicle">${driver.vehicle}</p><p class="driver-plate">${driver.plate}</p></div></div><p class="safety-reminder">${icon("shield")}<span><strong>Antes de embarcar</strong>Confira placa, cor e modelo do veículo.</span></p></div><button class="app-button uber-primary" data-action="finish">Conferi os dados</button></section></section>`;
}

function renderComplete() {
  return `<section class="app-screen uber-app-screen completion-screen app-scroll"><span class="completion-mark">✓</span><h1 data-screen-heading>Treinamento concluído</h1><p>Você escolheu partida e destino, conferiu a rota e os dados do veículo.</p><ul class="completion-items"><li>De: ${escapeHtml(origin.name)}</li><li>Para: ${escapeHtml(destination.name)}</li><li>Placa fictícia ${driver.plate} conferida</li></ul><button class="app-button uber-primary" data-action="reset">Planejar outra corrida</button><a class="app-button uber-secondary" href="../">Voltar para Mobilidade</a></section>`;
}

function setScreen(next, message) {
  window.clearTimeout(searchingTimer);
  screen = next;
  paymentOpen = false;
  render();
  announce(message || "Tela atualizada.");
  haptic();
  window.requestAnimationFrame(() => {
    const heading = uberApp.querySelector("[data-screen-heading]");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  });
}

function mapOptions() {
  const route = currentRoute();
  const selectable = screen === "planner" || screen === "search";
  const options = {
    theme: "uber", origin, destination, route, alternatives: routeOptions,
    draggable: screen === "planner" || screen === "rides",
    permanentLabels: screen === "planner",
    onLocationMove: (latlng, kind) => {
      const point = window.MobilityLocation.pointFromMap(latlng, kind === "origin" ? "Partida ajustada" : "Destino ajustado");
      if (kind === "origin") origin = point; else destination = point;
      routeOptions = []; plannerStatus = "";
      selectedRouteIndex = 0;
      if (screen === "rides") calculateRoute("rides"); else render();
    },
  };
  if (selectable) options.onMapSelect = (latlng) => selectLocation(window.MobilityLocation.pointFromMap(latlng));
  if (screen === "driver" && route?.geometry?.length) options.vehiclePoint = { latlng: route.geometry[Math.min(12, route.geometry.length - 1)], name: driver.name };
  return options;
}

function render() {
  const renderers = { planner: renderPlanner, search: renderSearch, rides: renderRides, summary: renderSummary, searching: renderSearching, driver: renderDriver, complete: renderComplete };
  const version = ++mapRenderVersion;
  activeMap?.stop(); activeMap?.off(); activeMap?.remove(); activeMap = null;
  uberApp.innerHTML = renderers[screen]();
  uberApp.dataset.screen = screen;
  document.body.dataset.mobilityScreen = screen;
  window.requestAnimationFrame(() => {
    if (version !== mapRenderVersion) return;
    const element = uberApp.querySelector("[data-live-map]");
    if (element) activeMap = window.MobilityMap.mount(element, mapOptions());
  });
}

function selectLocation(point) {
  const selectedTarget = searchTarget;
  if (selectedTarget === "origin") origin = point; else destination = point;
  if (selectedTarget === "origin" && !destination) searchTarget = "destination";
  routeOptions = [];
  plannerStatus = "";
  searchResults = [];
  searchStatus = "";
  searchQuery = "";
  setScreen("planner", `${point.name} escolhido como ${selectedTarget === "origin" ? "partida" : "destino"}.`);
}

async function performSearch(form) {
  const query = new FormData(form).get("query") || form.querySelector("input").value;
  if (query.trim().length < 3) return;
  searchQuery = query.trim();
  searchController?.abort();
  searchController = new AbortController();
  searchStatus = "Buscando locais..."; searchResults = []; render();
  try {
    searchResults = await window.MobilityLocation.search(query, { signal: searchController.signal });
    searchStatus = searchResults.length ? `${searchResults.length} locais encontrados` : "Nenhum local encontrado. Tente incluir bairro ou cidade.";
  } catch (error) {
    if (error.name === "AbortError") return;
    searchStatus = "Não foi possível buscar agora. Verifique a internet e tente novamente.";
  }
  render();
}

async function calculateRoute(returnScreen = "rides") {
  if (!origin || !destination) return;
  plannerStatus = "";
  routeController?.abort();
  routeController = new AbortController();
  announce("Calculando rota real pelas ruas.");
  const button = uberApp.querySelector('[data-action="calculate"]');
  if (button) { button.disabled = true; button.textContent = "Calculando rota..."; }
  try {
    routeOptions = await window.MobilityLocation.route(origin, destination, "ride", { signal: routeController.signal });
    selectedRouteIndex = 0;
    setScreen(returnScreen, "Rota calculada. Escolha uma opção de corrida.");
  } catch (error) {
    if (error.name === "AbortError") return;
    plannerStatus = `${error.message} Verifique a internet ou escolha outros pontos.`;
    announce(plannerStatus);
    render();
  }
}

uberApp.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-location-search]")) return;
  event.preventDefault();
  const input = event.target.querySelector("input");
  input.name = "query";
  performSearch(event.target);
});

uberApp.addEventListener("click", (event) => {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "open-search") { searchTarget = control.dataset.target; searchResults = []; searchStatus = ""; searchQuery = ""; setScreen("search", "Digite um endereço ou marque no mapa."); }
  if (action === "back" || action === "back-planner") setScreen("planner", "Planejador aberto.");
  if (action === "select-result") selectLocation(searchResults[Number(control.dataset.index)]);
  if (action === "use-location") navigator.geolocation?.getCurrentPosition(
    ({ coords }) => selectLocation({ id: "current", name: "Minha localização", detail: "Posição autorizada no navegador", latlng: [coords.latitude, coords.longitude] }),
    () => announce("Não foi possível obter sua localização. Você pode pesquisar ou marcar no mapa."),
    { enableHighAccuracy: true, timeout: 10000 },
  );
  if (action === "swap" && origin && destination) { [origin, destination] = [destination, origin]; routeOptions = []; plannerStatus = ""; render(); announce("Partida e destino invertidos."); }
  if (action === "calculate") calculateRoute();
  if (action === "select-ride") { selectedRide = rideOptions.find((item) => item.id === control.dataset.ride) || selectedRide; render(); }
  if (action === "open-payment") { paymentOpen = true; render(); }
  if (action === "close-payment") { paymentOpen = false; render(); }
  if (action === "payment") { payment = control.dataset.payment; paymentOpen = false; render(); announce(`${payment} selecionado.`); }
  if (action === "review") setScreen("summary", "Confira a corrida.");
  if (action === "back-rides" || action === "cancel") setScreen("rides", "Opções de corrida abertas.");
  if (action === "confirm") setScreen("searching", "Procurando motorista fictício.");
  if (action === "show-driver") setScreen("driver", "Motorista fictício encontrado.");
  if (action === "finish") setScreen("complete", "Treinamento concluído.");
  if (action === "reset") resetSimulation();
});

let swipeStart = null;
function goBack() {
  const previous = { search: "planner", rides: "planner", summary: "rides", searching: "rides", driver: "rides" }[screen];
  if (previous) setScreen(previous, "Tela anterior aberta.");
}
uberApp.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" || event.clientX > 28 || screen === "planner") return;
  swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
});
uberApp.addEventListener("pointerup", (event) => {
  if (!swipeStart || swipeStart.id !== event.pointerId) return;
  const deltaX = event.clientX - swipeStart.x;
  const deltaY = Math.abs(event.clientY - swipeStart.y);
  swipeStart = null;
  if (deltaX > 78 && deltaX > deltaY * 1.4) goBack();
});

function resetSimulation() {
  searchController?.abort(); routeController?.abort(); window.clearTimeout(searchingTimer);
  screen = "planner"; searchTarget = "destination"; origin = null; destination = null; searchResults = []; searchStatus = ""; searchQuery = ""; plannerStatus = "";
  routeOptions = []; selectedRouteIndex = 0; selectedRide = rideOptions[0]; payment = "Dinheiro"; paymentOpen = false;
  render(); announce("Planejador reiniciado. Escolha a partida e o destino."); haptic([8, 30, 8]);
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
