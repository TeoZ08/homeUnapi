(() => {
  const scriptUrl = document.currentScript?.src || window.location.href;
  const spriteUrl = new URL("../img/mobilidade/ui-icons.svg", scriptUrl).href;

  const points = {
    origin: [-20.495389, -54.61334],
    destination: [-20.464853, -54.616925],
    terminal: [-20.488364, -54.614518],
  };

  const pickups = [
    { name: "Entrada da AGEAD", latlng: points.origin },
    { name: "Portaria da Cidade Universitária", latlng: [-20.49447, -54.61238] },
    { name: "Terminal Morenão", latlng: points.terminal },
  ];

  const encodedRoutes = {
    recommended: "x`}af@vtidgB|@wCtBcE~CsDbBa@xJaCvO}D`HeCfHeDzIyEJGzAqCrAmESmC_B_@gC\\_An@_G|CgQjGgLzCaBVoMx@cXnCcH|@s@HqKpAwTnC{Ed@oS`CwcAfMaHx@iR~Bgg@fGqLnA}C\\mr@nHsBVkXjD{e@hGwHz@yHz@aBRau@lI{t@pIc@FoKlAyn@vH}TdCccA`Le`AlKuBXwGmj@iBgCePwRkC{DoB}GeN}x@_S}iA}S{oA{q@`PuAf@aAd@}Cd@ow@nJyMnByYjCob@nEyATqb@lEc]bEyOrA{b@~EgDZ{n@hGkRpBa[tCkk@fFgQhB_t@|HmUfC{Y`Dqx@xIybAvMom@hHuIr@{t@nHgIp@es@nGeD^eD\\NdNJr^@lNxA|s@jC~hAJfIggAvKsm@rG_}@lJmf@hFA?",
    integration: "x`}af@vtidgB|@wCtBcE~CsDbBa@xJaCvO}D`HeCfHeDzIyEJGzAqCrAmESmC_B_@gC\\_An@_G|CgQjGgLzCaBVoMx@cXnCcH|@s@HqKpAwTnC{Ed@oS`CwcAfMaHx@iR~Bgg@fGqLnA}C\\mr@nHsBVkXjD{e@hGwHz@yHz@aBRau@lI{t@pIc@FoKlAyn@vH}TdCccA`LlBnRhyAoPvo@gHxI_AhQmB~XyCtFm@ZEby@mJ`JcAnH{@xcA_MnJiAzg@cG`PkBgBaSqLnA}C\\mr@nHsBVkXjD{e@hGwHz@yHz@aBRau@lI{t@pIc@FoKlAyn@vH}TdCccA`Le`AlKuBXwGmj@iBgCePwRkC{DoB}GeN}x@_S}iA}S{oA{q@`PuAf@aAd@}Cd@ow@nJyMnByYjCob@nEyATqb@lEc]bEyOrA{b@~EgDZ{n@hGkRpBa[tCkk@fFgQhB_t@|HmUfC{Y`Dqx@xIybAvMom@hHuIr@{t@nHgIp@es@nGeD^eD\\NdNJr^@lNxA|s@jC~hAJfIggAvKsm@rG_}@lJmf@hFA?",
    "less-walking": "x`}af@vtidgB|@wCtBcE~CsDbBa@xJaCvO}D`HeCfHeDzIyEJGzAqCrAmESmC_B_@gC\\_An@_G|CgQjGgLzCaBVoMx@cXnCcH|@s@HqKpAwTnC{Ed@oS`CwcAfMaHx@iR~Bgg@fGqLnA}C\\mr@nHsBVkXjD{e@hGwHz@yHz@aBRau@lI{t@pIc@FoKlAyn@vH}TdCccA`Le`AlKuBXaGR{FF_Ia@sSkD_G{@iCDoCt@aDhCeBfDkBzE_H|ReDrE{HlPaOb[{[vq@oHrOoAjCu]|t@mE~J{f@beAkW~h@uDdImUjg@kk@_[gc@gUg]kRidAki@wV}MgYoOiX_O_VeNaJiFkc@_Wsp@u^w@mEsBoDcD}BaE_AiEFwDab@{D}f@aCuZarBjWkG`@caAbK{hAvLqCXgFPggAvKsm@rG_}@lJmf@hFA?",
    shopping: "x`}af@vtidgB|@wCtBcE~CsDbBa@xJaCvO}D`HeCfHeDzIyEJGzAqCrAmESmC_B_@gC\\_An@_G|CgQjGgLzCaBVoMx@cXnCcH|@s@HqKpAwTnC{Ed@oS`CwcAfMaHx@iR~Bgg@fGqLnA}C\\mr@nHsBVkXjD{e@hGwHz@yHz@aBRau@lI{t@pIc@FoKlAyn@vH}TdCccA`Le`AlKuBXaGR{FF_Ia@sSkDcMeIqKgKeD{FwBeGgCcKkOmaAwJom@gGu`@iTckA_RijAe@oEsOm~@cBmJ}UyqAoI}g@cHuc@qVi|AmM}w@eFe\\aWe{A}CwRIe@}Kyp@uAgIkAqJw@iGyMsw@mK}r@i\\yoBiAmGwCsOwDyTsFs[aKym@w@}CgPqaA_EeVeLsi@cB}EkIoIkb@g\\cCkBeBsA{AkAQM_GoImMgYqMkZ_CcEqSsb@mAwBkCyE}EmGiBiBoDkDoFsCcEm@qDk@qB@wF?}DHkEFwIf@uAZiH~A}HtDcOtJkIlDmIfBsJPaLqAgP{Bmn@sJuBy@mBiAiCuBeDgD{BmAiEmAoIeAoBe@}@T_Ch@_QlEyDdB_IpD_P~Je@ZuChDoAhDcHtZ}@dAsB|BcHrGwCnBmAz@sX|MaPxE{EzA{HfCwe@dMuNnBik@`GuDZaEv@ikAxL{^pEm}@rJ{E}@_Do@aEo@sEaBeCiDeDuIkGgQsE{j@e@oGmAkPq@eIkBoTgBeW_BwR_@qDc@aGuAgYa@mCf@wADiBs@}Am@kAu@_@}BOae@yFuGo@wjBiQgQgBmIqA{IwD_EeEsDsFeE}HQiBsGat@iB_DmAq@_AWcDBwB`@o^pFgMbAsTxCaFh@{o@nHaD^uKhBsTtCkRtC{EdAqcAzTJr@lk@gHdc@eFZzBVpBEhAO|@w@n@}FfBwBdBcAjBCdCbAhHVtHnDjGhDpGfEnIfB|C~@t@pAFdGs@~CIpE`AvSnVbCj@",
    hospital: "x`}af@vtidgB|@wCtBcE~CsDbBa@xJaCvO}D`HeCfHeDzIyEJGzAqCrAmESmC_B_@gC\\_An@_G|CgQjGgLzCaBVgPrEaIpBwB|@uChCsAjC{@nFeB|RLn[i@dKy@nIwBdLb@nG`B`LbBxEdAzCbF`JbEfEbFjCdSzIh@j@`Bv@lBPlBUf@SpCvCbBt@tJdDn{@|X`J|CzUbIr@VnAb@pE|Ap@wBxBgHzAcFz`@|N",
    terminal: "x`}af@vtidgB|@wCtBcE~CsDbBa@xJaCvO}D`HeCfHeDzIyEJGzAqCrAmESmC_B_@gC\\_An@_G|CgQjGgLzCaBVoMx@cXnCcH|@s@HqKpAwTnC{Ed@oS`CwcAfMaHx@iR~Bgg@fGqLnA}C\\mr@nHsBVkXjD{e@hGwHz@yHz@aBRau@lI{t@pIc@FoKlAyn@vH}TdCccA`LlBnRhyAoPvo@gHxI_AhQmB~XyCtFm@",
    mercadao: "x`}af@vtidgB|@wCtBcE~CsDbBa@xJaCvO}D`HeCfHeDzIyEJGzAqCrAmESmC_B_@gC\\_An@_G|CgQjGgLzCaBVoMx@cXnCcH|@s@HqKpAwTnC{Ed@oS`CwcAfMaHx@iR~Bgg@fGqLnA}C\\mr@nHsBVkXjD{e@hGwHz@yHz@aBRau@lI{t@pIc@FoKlAyn@vH}TdCccA`Le`AlKuBXaGR{FF_Ia@sSkD_G{@iCDoCt@aDhCeBfDkBzE_H|ReDrE{HlPaOb[{[vq@oHrOoAjCu]|t@mE~J{f@beAkW~h@uDdImUjg@kS~b@wM~Xy_@`y@kUlf@mBbEmUbCwM`BwU`BeLFmMc@wN}AyMqBoKsBqTqG_P_HkFgCqDwBs~@wn@kWuQwUsO_VyQoa@_YuSiL_HmD{j@c_@{P{GaAQcB_@yFmAqJe@sKC}SImIHkLNmEn@kEt@qH~@kH|@oOtAmhAjHyDPaH~@qL~AeKaBaDmCc@aAIy@NqB{AScIsAyQcDcDcKDk@b@]vIw@rZsCZ`F_BZ",
  };

  const routeDestinations = {
    recommended: points.destination,
    integration: points.destination,
    "less-walking": points.destination,
    shopping: [-20.4572438, -54.5876329],
    hospital: [-20.4989278, -54.6165499],
    terminal: points.terminal,
    mercadao: [-20.466831, -54.6200767],
  };

  function decodePolyline(encoded, precision = 6) {
    const coordinates = [];
    const factor = 10 ** precision;
    let index = 0;
    let latitude = 0;
    let longitude = 0;

    while (index < encoded.length) {
      let byte;
      let shift = 0;
      let result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 31) << shift;
        shift += 5;
      } while (byte >= 32);
      latitude += result & 1 ? ~(result >> 1) : result >> 1;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 31) << shift;
        shift += 5;
      } while (byte >= 32);
      longitude += result & 1 ? ~(result >> 1) : result >> 1;
      coordinates.push([latitude / factor, longitude / factor]);
    }

    return coordinates;
  }

  const routes = Object.fromEntries(
    Object.entries(encodedRoutes).map(([name, encoded]) => [name, decodePolyline(encoded)]),
  );

  function svgIcon(name) {
    return `<svg aria-hidden="true"><use href="${spriteUrl}#${name}"></use></svg>`;
  }

  function markerIcon(kind, label = "") {
    const iconNames = {
      bus: "m-bus",
      car: "car",
      destination: "m-location",
      origin: "locate",
      walk: "m-walk",
    };
    const safeLabel = String(label).replace(/[<>&"']/g, "");
    return window.L.divIcon({
      className: "mobility-leaflet-icon",
      html: `<span class="mobility-map-marker marker-${kind}">${svgIcon(iconNames[kind] || "m-location")}${safeLabel ? `<b>${safeLabel}</b>` : ""}</span>`,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });
  }

  function addMarker(map, latlng, kind, label, options = {}) {
    const marker = window.L.marker(latlng, {
      icon: markerIcon(kind, options.badge),
      keyboard: options.keyboard !== false,
      riseOnHover: true,
    }).addTo(map);
    if (label) {
      marker.bindTooltip(label, {
        permanent: Boolean(options.permanent),
        direction: options.direction || "top",
        offset: options.offset || [0, -20],
        className: "mobility-map-tooltip",
      });
    }
    return marker;
  }

  function addRoute(map, coordinates, theme, options = {}) {
    const primary = theme === "uber" ? "#111111" : "#1967d2";
    const color = options.color || primary;
    const weight = options.weight || 6;
    if (options.casing !== false) {
      window.L.polyline(coordinates, {
        color: options.casingColor || "rgba(255,255,255,0.95)",
        weight: weight + 5,
        opacity: 0.96,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      }).addTo(map);
    }
    return window.L.polyline(coordinates, {
      color,
      weight,
      opacity: options.opacity ?? 1,
      dashArray: options.dashArray,
      lineCap: "round",
      lineJoin: "round",
      className: `mobility-route mobility-route-${theme}`,
      interactive: false,
    }).addTo(map);
  }

  function fitRoute(map, coordinates, container, padding = 24) {
    const verticalPadding = Math.max(padding, Math.round(container.clientHeight * 0.08));
    map.fitBounds(window.L.latLngBounds(coordinates), {
      paddingTopLeft: [padding, verticalPadding],
      paddingBottomRight: [padding, verticalPadding],
      maxZoom: 16,
      animate: false,
    });
  }

  function addEndpoints(map, theme, options = {}) {
    const destination = routeDestinations[options.routeName] || points.destination;
    addMarker(map, points.origin, "origin", "UnAPI · AGEAD", {
      permanent: Boolean(options.permanent),
      direction: "bottom",
      offset: [0, 19],
    });
    addMarker(map, destination, "destination", options.destinationLabel || "Destino", {
      permanent: Boolean(options.permanent),
      direction: "top",
    });
    if (theme === "maps" && options.bus) {
      addMarker(map, points.terminal, "bus", "Terminal Morenão", { badge: "059" });
    }
  }

  function mount(container, options = {}) {
    if (!container || !window.L) return null;
    const theme = options.theme || "maps";
    const view = options.view || "route";
    const routeName = options.route && routes[options.route] ? options.route : "recommended";
    const coordinates = routes[routeName];
    const map = window.L.map(container, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: true,
      dragging: true,
      tap: true,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    });

    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (view === "home") {
      map.setView(points.origin, 15);
      addMarker(map, points.origin, "origin", "Sua localização", { permanent: true, direction: "bottom", offset: [0, 19] });
      [[-20.49368, -54.61418], [-20.49714, -54.61276], [-20.49171, -54.61507]].forEach((latlng) => addMarker(map, latlng, "car"));
    } else if (view === "pickup") {
      const pickupMarkers = pickups.map((pickup) => {
        const selected = pickup.name === options.selectedPickup;
        const marker = addMarker(map, pickup.latlng, selected ? "origin" : "car", pickup.name, {
          permanent: selected,
          direction: "top",
        });
        marker.on("click", () => options.onPickupSelect?.(pickup.name));
        return pickup.latlng;
      });
      map.fitBounds(window.L.latLngBounds(pickupMarkers), { padding: [35, 35], maxZoom: 16, animate: false });
    } else if (view === "place") {
      map.setView(points.destination, 16);
      addMarker(map, points.destination, "destination", "Praça Ary Coelho", { permanent: true });
    } else if (view === "routes") {
      ["recommended", "integration", "less-walking"].forEach((name) => {
        const route = routes[name];
        if (name === routeName) return;
        addRoute(map, route, "maps", { color: "#88929c", weight: 4, opacity: 0.55, casing: false });
      });
      addRoute(map, coordinates, "maps", { weight: 7 });
      addEndpoints(map, "maps", { bus: true, routeName, destinationLabel: options.destinationLabel });
      fitRoute(map, coordinates, container, 22);
    } else if (view === "journey") {
      const progress = Math.max(0, Math.min(1, Number(options.progress) || 0));
      const lastIndex = Math.max(1, Math.round((coordinates.length - 1) * progress));
      addRoute(map, coordinates, "maps", { color: "#aeb6bf", weight: 6, opacity: 0.75 });
      addRoute(map, coordinates.slice(0, lastIndex + 1), "maps", { weight: 7 });
      const markerKind = progress < 0.35 || progress > 0.88 ? "walk" : "bus";
      addMarker(map, coordinates[lastIndex], markerKind, progress >= 1 ? "Destino" : "Você está aqui", {
        badge: markerKind === "bus" ? "059" : "",
        permanent: true,
      });
      addEndpoints(map, "maps", { routeName, destinationLabel: options.destinationLabel });
      fitRoute(map, coordinates, container, 20);
    } else if (view === "driver") {
      const segmentEnd = Math.min(28, coordinates.length - 1);
      const segment = coordinates.slice(0, segmentEnd + 1);
      addRoute(map, segment, "uber", { weight: 6 });
      addMarker(map, coordinates[segmentEnd], "car", "Carlos · 5 min", { permanent: true });
      addMarker(map, points.origin, "origin", "Embarque", { permanent: true, direction: "bottom", offset: [0, 19] });
      fitRoute(map, segment, container, 34);
    } else {
      addRoute(map, coordinates, theme, { weight: theme === "uber" ? 7 : 6 });
      addEndpoints(map, theme, { bus: theme === "maps", routeName, destinationLabel: options.destinationLabel });
      fitRoute(map, coordinates, container, 24);
    }

    window.setTimeout(() => {
      if (map._container?.isConnected) map.invalidateSize({ animate: false });
    }, 0);
    return map;
  }

  window.MobilityMap = { mount, points, routes };
})();
