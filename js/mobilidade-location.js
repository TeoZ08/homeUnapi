(() => {
  const CAMPO_GRANDE = [-20.4697, -54.6201];
  const searchCache = new Map();
  let lastSearchAt = 0;
  let searchQueue = Promise.resolve();

  const routeServices = {
    car: "https://router.project-osrm.org/route/v1/driving",
    ride: "https://router.project-osrm.org/route/v1/driving",
    walk: "https://routing.openstreetmap.de/routed-foot/route/v1/driving",
    bike: "https://routing.openstreetmap.de/routed-bike/route/v1/driving",
  };

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function shortAddress(displayName) {
    return displayName.split(",").slice(1, 4).join(",").trim() || "Local encontrado";
  }

  async function searchNow(query, signal) {
    const elapsed = Date.now() - lastSearchAt;
    if (elapsed < 1050) await wait(1050 - elapsed);
    if (signal?.aborted) throw new DOMException("Busca cancelada", "AbortError");
    lastSearchAt = Date.now();

    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "5",
      countrycodes: "br",
      addressdetails: "1",
      viewbox: "-54.78,-20.35,-54.43,-20.66",
    });
    let response;
    try {
      response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        signal,
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      if (error.name === "AbortError") throw error;
      throw new Error("Não foi possível acessar o serviço de busca.");
    }
    if (!response.ok) throw new Error("O serviço de busca não respondeu.");
    const data = await response.json();
    return data.map((item) => ({
      id: `${item.osm_type}-${item.osm_id}`,
      name: item.name || item.display_name.split(",")[0] || "Local sem nome",
      detail: shortAddress(item.display_name),
      fullName: item.display_name,
      latlng: [Number(item.lat), Number(item.lon)],
    }));
  }

  function search(query, options = {}) {
    const normalized = query.trim().replace(/\s+/g, " ");
    if (normalized.length < 3) return Promise.resolve([]);
    const cacheKey = normalized.toLocaleLowerCase("pt-BR");
    if (searchCache.has(cacheKey)) return Promise.resolve(searchCache.get(cacheKey));

    const task = async () => {
      const results = await searchNow(normalized, options.signal);
      searchCache.set(cacheKey, results);
      return results;
    };
    const result = searchQueue.then(task, task);
    searchQueue = result.catch(() => undefined);
    return result;
  }

  async function route(origin, destination, mode = "car", options = {}) {
    const service = routeServices[mode];
    if (!service) throw new Error("Este modo de transporte não possui rota disponível.");
    const coordinates = `${origin.latlng[1]},${origin.latlng[0]};${destination.latlng[1]},${destination.latlng[0]}`;
    const params = new URLSearchParams({
      alternatives: mode === "car" || mode === "ride" ? "true" : "false",
      steps: "true",
      geometries: "geojson",
      overview: "full",
    });
    let response;
    try {
      response = await fetch(`${service}/${coordinates}?${params}`, {
        signal: options.signal,
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      if (error.name === "AbortError") throw error;
      throw new Error("Não foi possível acessar o serviço de rotas.");
    }
    if (!response.ok) throw new Error("O serviço de rotas não respondeu.");
    const data = await response.json();
    if (data.code !== "Ok" || !data.routes?.length) {
      throw new Error("Não foi possível traçar uma rota entre esses pontos.");
    }
    return data.routes.map((item, index) => ({
      id: `${mode}-${index}`,
      distance: item.distance,
      duration: item.duration,
      geometry: item.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
      steps: item.legs.flatMap((leg) => leg.steps || []),
    }));
  }

  function pointFromMap(latlng, label = "Ponto escolhido no mapa") {
    return {
      id: `map-${latlng.lat.toFixed(6)}-${latlng.lng.toFixed(6)}`,
      name: label,
      detail: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`,
      fullName: label,
      latlng: [latlng.lat, latlng.lng],
    };
  }

  function formatDuration(seconds) {
    if (seconds <= 0) return "agora";
    if (seconds < 60) return "< 1 min";
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function formatDistance(meters) {
    return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
  }

  window.MobilityLocation = {
    center: CAMPO_GRANDE,
    search,
    route,
    pointFromMap,
    formatDuration,
    formatDistance,
  };
})();
