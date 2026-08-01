(() => {
  const scriptUrl = document.currentScript?.src || window.location.href;
  const spriteUrl = new URL("../img/mobilidade/ui-icons.svg", scriptUrl).href;

  function escapeText(value) {
    return String(value || "").replace(/[<>&"']/g, "");
  }

  function svgIcon(name) {
    return `<svg aria-hidden="true"><use href="${spriteUrl}#${name}"></use></svg>`;
  }

  function markerIcon(kind, badge = "") {
    const iconNames = { car: "car", walk: "m-walk", bike: "m-bike", current: "m-navigation" };
    const letter = kind === "origin" ? "A" : kind === "destination" ? "B" : "";
    const content = letter || svgIcon(iconNames[kind] || "m-location");
    return window.L.divIcon({
      className: "mobility-leaflet-icon",
      html: `<span class="mobility-map-marker marker-${kind}"><span class="marker-content">${content}</span>${badge ? `<b>${escapeText(badge)}</b>` : ""}</span>`,
      iconSize: [44, 52],
      iconAnchor: [22, kind === "origin" || kind === "destination" ? 50 : 22],
    });
  }

  function addMarker(map, point, kind, options = {}) {
    if (!point?.latlng) return null;
    const marker = window.L.marker(point.latlng, {
      icon: markerIcon(kind, options.badge),
      keyboard: true,
      draggable: Boolean(options.draggable),
      riseOnHover: true,
      autoPan: true,
    }).addTo(map);
    const label = options.label || point.name;
    if (label) {
      marker.bindTooltip(escapeText(label), {
        permanent: Boolean(options.permanent),
        direction: "top",
        offset: [0, -44],
        className: "mobility-map-tooltip",
      });
    }
    if (options.draggable) {
      marker.on("dragend", () => options.onMove?.(marker.getLatLng(), kind));
    }
    return marker;
  }

  function addRoute(map, coordinates, theme, options = {}) {
    if (!coordinates?.length) return null;
    const color = options.color || (theme === "uber" ? "#111111" : "#1967d2");
    const weight = options.weight || 6;
    if (options.casing !== false) {
      window.L.polyline(coordinates, {
        color: "rgba(255,255,255,.96)", weight: weight + 5, opacity: 1,
        lineCap: "round", lineJoin: "round", interactive: false,
      }).addTo(map);
    }
    return window.L.polyline(coordinates, {
      color, weight, opacity: options.opacity ?? 1, dashArray: options.dashArray,
      lineCap: "round", lineJoin: "round", interactive: false,
      className: `mobility-route mobility-route-${theme}`,
    }).addTo(map);
  }

  function fitPoints(map, points, container, maxZoom = 16) {
    const coordinates = points.filter(Boolean).map((point) => point.latlng || point);
    if (!coordinates.length) return;
    if (coordinates.length === 1) {
      map.setView(coordinates[0], maxZoom);
      return;
    }
    const vertical = Math.max(28, Math.round(container.clientHeight * 0.09));
    map.fitBounds(window.L.latLngBounds(coordinates), {
      paddingTopLeft: [28, vertical], paddingBottomRight: [28, vertical], maxZoom, animate: false,
    });
  }

  function mount(container, options = {}) {
    if (!container || !window.L) return null;
    const theme = options.theme || "maps";
    const map = window.L.map(container, {
      zoomControl: false, attributionControl: true, scrollWheelZoom: false,
      doubleClickZoom: true, boxZoom: false, keyboard: true, dragging: true,
      tap: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false,
    });
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const origin = options.origin;
    const destination = options.destination;
    const selectedRoute = options.route;
    const alternatives = options.alternatives || [];

    alternatives.forEach((route) => {
      if (route === selectedRoute) return;
      addRoute(map, route.geometry, theme, { color: "#8b949e", weight: 4, opacity: 0.56, casing: false });
    });
    if (selectedRoute) addRoute(map, selectedRoute.geometry, theme, { weight: theme === "uber" ? 7 : 6 });

    addMarker(map, origin, "origin", {
      permanent: options.permanentLabels,
      draggable: options.draggable,
      onMove: options.onLocationMove,
    });
    addMarker(map, destination, "destination", {
      permanent: options.permanentLabels,
      draggable: options.draggable,
      onMove: options.onLocationMove,
    });

    if (options.vehiclePoint) {
      addMarker(map, options.vehiclePoint, "car", { label: options.vehicleLabel || "Motorista" });
    }
    if (options.progress != null && selectedRoute?.geometry?.length) {
      const index = Math.min(selectedRoute.geometry.length - 1, Math.max(0, Math.round((selectedRoute.geometry.length - 1) * options.progress)));
      addMarker(map, { latlng: selectedRoute.geometry[index], name: "Você está aqui" }, options.mode === "bike" ? "bike" : options.mode === "walk" ? "walk" : "current", { permanent: true });
    }

    const fitSource = selectedRoute?.geometry?.length ? selectedRoute.geometry : [origin, destination];
    fitPoints(map, fitSource, container, options.zoom || 16);
    if (!fitSource.filter(Boolean).length) map.setView(options.center || window.MobilityLocation?.center || [-20.4697, -54.6201], 13);

    if (options.onMapSelect) {
      map.getContainer().classList.add("map-is-selectable");
      map.on("click", (event) => options.onMapSelect(event.latlng));
    }
    window.setTimeout(() => map._container?.isConnected && map.invalidateSize({ animate: false }), 0);
    return map;
  }

  window.MobilityMap = { mount };
})();
