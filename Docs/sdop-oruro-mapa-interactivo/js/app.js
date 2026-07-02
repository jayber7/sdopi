let seleccionado = municipios.find(m => m.nombre === "Oruro") || municipios[0];
let filtroEstado = "todos";
let busqueda = "";
let fotoActual = 0;
let map;
let markerLayer;
let selectedCircle;
let selectedRoute;
let routeVisible = true;
let cityMarker;
let polygonLayer;
let currentTileLayer;
let currentStyle = "osm";
let searchResults = [];
let searchTimeout;
let complementaryLayers = {};
let osmRouteGeometry = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function limpiar(texto = "") {
  return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeHTML(texto = "") {
  return String(texto)
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/'/g, "'");
}

function visibles() {
  return municipios.filter((m) => {
    const estadoOk = filtroEstado === "todos" || m.estado === filtroEstado;
    const texto = limpiar([
      m.nombre,
      m.provincia,
      m.unidad,
      m.descripcion,
      ...m.destacados.map(p => `${p.titulo} ${p.detalle}`)
    ].join(" "));
    const busquedaOk = !busqueda || texto.includes(limpiar(busqueda));
    return estadoOk && busquedaOk;
  });
}

function initMap() {
  if (typeof L === "undefined") {
    $("#realMap").innerHTML = `
      <div class="map-error">
        <div>
          <strong>No se pudo cargar el mapa</strong>
          <span>Revisa la conexión a internet o instala la librería cartográfica localmente.</span>
        </div>
      </div>`;
    return;
  }

  map = L.map("realMap", {
    zoomControl: false,
    scrollWheelZoom: true,
    preferCanvas: true,
    attributionControl: false
  }).setView(oruroCentro, 7);

  L.control.zoom({ position: "bottomright" }).addTo(map);

  applyTileLayer("osm");

  const attribution = L.control({ position: "bottomleft" });
  attribution.onAdd = () => {
    const div = L.DomUtil.create("div", "custom-attribution");
    div.innerHTML = "© OpenStreetMap contributors";
    return div;
  };
  attribution.addTo(map);

  markerLayer = L.layerGroup().addTo(map);
  polygonLayer = L.layerGroup().addTo(map);

  const cityIcon = L.divIcon({
    className: "city-map-marker",
    html: `<div class="city-pin" title="Ciudad de Oruro"><span>GO</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });
  cityMarker = L.marker(ciudadOruro, { icon: cityIcon, zIndexOffset: 800 })
    .bindPopup(`<div class="popup-title">Ciudad de Oruro</div><div class="popup-muted">Punto institucional de referencia</div>`)
    .addTo(map);

  loadOsmPolygons();
}

function applyTileLayer(style) {
  if (!map) return;
  const layers = OsmServices.getTileLayers();
  const config = layers[style] || layers.osm;

  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
  }

  currentTileLayer = L.tileLayer(config.url, {
    maxZoom: config.options.maxZoom,
    attribution: config.options.attribution
  }).addTo(map);

  currentStyle = style;
  updateStyleButtons();
}

function updateStyleButtons() {
  $$(".style-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.style === currentStyle);
  });
}

function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

async function loadOsmPolygons() {
  const geojson = await OsmServices.getMunicipiosPolygons();
  if (!geojson || !geojson.features.length) {
    console.info("Sin polígonos OSM, usando puntos");
    return;
  }

  polygonLayer.clearLayers();

  geojson.features.forEach(feature => {
    if (!feature.geometry) return;

    const matched = municipios.find(m =>
      limpiar(m.nombre).includes(limpiar(feature.properties.name).split("-")[0]) ||
      limpiar(feature.properties.name).includes(limpiar(m.nombre))
    );

    const estado = matched ? matched.estado : "normal";

    const polygon = L.geoJSON(feature, {
      style: {
        color: estadoColor[estado],
        weight: 2,
        opacity: 0.6,
        fillColor: estadoColor[estado],
        fillOpacity: 0.08,
        dashArray: "6 4"
      }
    });

    if (matched) {
      polygon.on("click", () => seleccionar(matched.id, true));
      polygon.bindTooltip(matched.nombre, {
        permanent: false,
        direction: "center",
        className: "polygon-tooltip"
      });
    }

    polygonLayer.addLayer(polygon);
  });
}

function crearPopup(m) {
  return `
    <div class="oruro-popup">
      <div class="popup-title">${escapeHTML(m.nombre)}</div>
      <div class="popup-muted">${escapeHTML(m.provincia)} • ${escapeHTML(m.unidad)}</div>
      <div class="popup-grid">
        <div class="popup-box"><strong>${m.proyectos}</strong><span>Proyectos</span></div>
        <div class="popup-box"><strong>${m.avance}%</strong><span>Avance físico</span></div>
        <div class="popup-box"><strong>${m.financiero}%</strong><span>Financiero</span></div>
        <div class="popup-box"><strong>${estadoLabel[m.estado]}</strong><span>Estado</span></div>
      </div>
      <button class="popup-action" type="button" data-select="${m.id}">Ver ficha</button>
    </div>`;
}

function renderMapMarkers() {
  if (!map || !markerLayer) return;
  markerLayer.clearLayers();

  visibles().forEach((m) => {
    const isActive = m.id === seleccionado.id;
    const icon = L.divIcon({
      className: "territory-map-marker",
      html: `<div class="map-pin ${m.estado} ${isActive ? "active" : ""}" data-label="${escapeHTML(m.nombre)}"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const marker = L.marker(m.coords, { icon, title: m.nombre, zIndexOffset: isActive ? 600 : 200 })
      .bindPopup(crearPopup(m), { className: "oruro-popup-shell" })
      .on("click", () => seleccionar(m.id, false));

    markerLayer.addLayer(marker);
  });

  drawSelectionEffects();
}

function drawSelectionEffects() {
  if (!map) return;

  if (selectedCircle) map.removeLayer(selectedCircle);
  if (selectedRoute) map.removeLayer(selectedRoute);

  selectedCircle = L.circle(seleccionado.coords, {
    radius: 18000,
    color: estadoColor[seleccionado.estado],
    weight: 2,
    fillColor: estadoColor[seleccionado.estado],
    fillOpacity: 0.12,
    dashArray: "6 8"
  }).addTo(map);

  if (routeVisible) {
    if (osmRouteGeometry) {
      selectedRoute = L.geoJSON(osmRouteGeometry, {
        style: {
          color: "#d8a21d",
          weight: 4,
          opacity: 0.85,
          dashArray: "12 8"
        }
      }).addTo(map);
    } else {
      selectedRoute = L.polyline([ciudadOruro, seleccionado.coords], {
        color: "#d8a21d",
        weight: 3,
        opacity: 0.85,
        dashArray: "8 10"
      }).addTo(map);
    }
  }
}

async function fetchOsmRoute() {
  if (!seleccionado || seleccionado.nombre === "Oruro") {
    osmRouteGeometry = null;
    return;
  }

  const route = await OsmServices.getRoute(ciudadOruro, seleccionado.coords);
  if (route && route.geometry) {
    osmRouteGeometry = route.geometry;
    renderRouteInfo(route);
  } else {
    osmRouteGeometry = null;
  }
}

function renderRouteInfo(route) {
  let infoEl = $("#routeInfo");
  if (!infoEl) {
    infoEl = document.createElement("div");
    infoEl.id = "routeInfo";
    infoEl.className = "route-info";
    $(".map-header").appendChild(infoEl);
  }
  infoEl.innerHTML = `
    <span>📍 Ruta real: ${formatDistance(route.distance)} • ${formatDuration(route.duration)}</span>
  `;
}

function distanciaDesdeOruro(m) {
  if (!map || typeof map.distance !== "function") return 0;
  return Math.round(map.distance(ciudadOruro, m.coords) / 1000);
}

function renderHeroKpis() {
  const totalProyectos = municipios.reduce((sum, m) => sum + m.proyectos, 0);
  const promedio = Math.round(municipios.reduce((sum, m) => sum + m.avance, 0) / municipios.length);
  const alertas = municipios.filter(m => m.estado === "alerta" || m.estado === "observado").length;
  const kpis = [
    { valor: provincias.length, label: "Provincias" },
    { valor: municipios.length, label: "Municipios" },
    { valor: totalProyectos, label: "Proyectos" },
    { valor: `${promedio}%`, label: "Avance prom." },
    { valor: alertas, label: "Revisión" }
  ];

  $("#heroKpis").innerHTML = kpis.map(k => `
    <div class="hero-kpi">
      <strong>${k.valor}</strong>
      <span>${k.label}</span>
    </div>`).join("");
}

function renderLista() {
  const lista = visibles();
  const contenedor = $("#territoryList");

  if (!lista.length) {
    contenedor.innerHTML = `<div class="empty-state">No se encontraron municipios con ese criterio.</div>`;
    return;
  }

  contenedor.innerHTML = lista.map((m) => `
    <button class="territory-item ${m.id === seleccionado.id ? "active" : ""}" type="button" data-id="${m.id}">
      <i class="territory-dot ${m.estado}"></i>
      <span>
        <strong>${escapeHTML(m.nombre)}</strong>
        <span>${escapeHTML(m.provincia)} • ${escapeHTML(m.unidad)}</span>
      </span>
      <small>${m.avance}%</small>
    </button>`).join("");

  $$(".territory-item").forEach(btn => {
    btn.addEventListener("click", () => seleccionar(btn.dataset.id));
  });
}

function renderDetalle() {
  const distancia = distanciaDesdeOruro(seleccionado);
  $("#mapSubtitle").textContent = `${seleccionado.nombre} seleccionado • ${seleccionado.provincia} • ${distancia} km aprox. desde Oruro`;

  $("#detailPanel").innerHTML = `
    <div class="detail-cover">
      <span>Municipio seleccionado</span>
      <h2>${escapeHTML(seleccionado.nombre)}</h2>
      <p>${escapeHTML(seleccionado.provincia)}</p>
      <div class="status-pill ${seleccionado.estado}">${estadoLabel[seleccionado.estado]}</div>
    </div>
    <div class="detail-body">
      <div class="info-grid">
        <div class="info-box"><strong>${seleccionado.proyectos}</strong><span>Proyectos activos</span></div>
        <div class="info-box"><strong>${distancia} km</strong><span>Distancia referencial</span></div>
        <div class="info-box"><strong>${escapeHTML(seleccionado.unidad)}</strong><span>Unidad responsable</span></div>
        <div class="info-box"><strong>${seleccionado.coords[0].toFixed(3)}</strong><span>Latitud</span></div>
      </div>
      <div class="progress">
        <div class="progress-row">
          <header><span>Avance físico</span><strong>${seleccionado.avance}%</strong></header>
          <div class="bar"><i style="--value:${seleccionado.avance}%"></i></div>
        </div>
        <div class="progress-row">
          <header><span>Avance financiero</span><strong>${seleccionado.financiero}%</strong></header>
          <div class="bar fin"><i style="--value:${seleccionado.financiero}%"></i></div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn primary" type="button" id="zoomSelected">Acercar mapa</button>
        <button class="btn" type="button" id="openPopup">Abrir punto</button>
      </div>
    </div>`;

  $("#zoomSelected")?.addEventListener("click", () => map?.flyTo(seleccionado.coords, 11, { duration: 0.8 }));
  $("#openPopup")?.addEventListener("click", () => abrirPopupSeleccionado());
}

function abrirPopupSeleccionado() {
  if (!map || !markerLayer) return;
  markerLayer.eachLayer((layer) => {
    const latlng = layer.getLatLng?.();
    if (!latlng) return;
    if (Math.abs(latlng.lat - seleccionado.coords[0]) < 0.0001 && Math.abs(latlng.lng - seleccionado.coords[1]) < 0.0001) {
      layer.openPopup();
    }
  });
}

function renderMunicipios() {
  $("#municipalityTitle").textContent = `Municipios de ${seleccionado.provincia}`;
  const relacionados = municipios.filter(m => m.provincia === seleccionado.provincia);
  $("#municipalityGrid").innerHTML = relacionados.map(m => `
    <button class="chip ${m.id === seleccionado.id ? "active" : ""}" type="button" data-id="${m.id}">
      ${escapeHTML(m.nombre)}
    </button>`).join("");

  $$("#municipalityGrid .chip").forEach(btn => {
    btn.addEventListener("click", () => seleccionar(btn.dataset.id));
  });
}

function renderProyectos() {
  $("#projectTitle").textContent = `Proyectos en ${seleccionado.nombre}`;
  $("#projectTimeline").innerHTML = seleccionado.destacados.map((p, index) => `
    <div class="project-row">
      <i>${index + 1}</i>
      <div>
        <strong>${escapeHTML(p.titulo)}</strong>
        <span>${escapeHTML(p.detalle)}</span>
      </div>
    </div>`).join("");
}

function renderGaleria() {
  const foto = seleccionado.fotos[fotoActual % seleccionado.fotos.length];
  $("#galleryTitle").textContent = `Galería de ${seleccionado.nombre}`;
  $("#galleryStage").style.setProperty("--photo", foto.fondo);
  $("#galleryStage").innerHTML = `
    <div>
      <strong>${escapeHTML(foto.titulo)}</strong>
      <span>${escapeHTML(foto.subtitulo)}</span>
    </div>`;

  $("#galleryDots").innerHTML = seleccionado.fotos.map((_, index) => `
    <button class="${index === fotoActual ? "active" : ""}" type="button" aria-label="Ver imagen ${index + 1}" data-index="${index}"></button>`).join("");

  $$("#galleryDots button").forEach(btn => {
    btn.addEventListener("click", () => {
      fotoActual = Number(btn.dataset.index);
      renderGaleria();
    });
  });
}

function renderAll() {
  renderHeroKpis();
  renderLista();
  renderMapMarkers();
  renderDetalle();
  renderMunicipios();
  renderProyectos();
  renderGaleria();
}

async function seleccionar(id, acercar = true) {
  const nuevo = municipios.find(m => m.id === id);
  if (!nuevo) return;
  seleccionado = nuevo;
  fotoActual = 0;

  osmRouteGeometry = null;
  const routeInfo = $("#routeInfo");
  if (routeInfo) routeInfo.innerHTML = "";

  renderAll();
  if (acercar && map) {
    map.flyTo(seleccionado.coords, 10, { duration: 0.75 });
  }

  if (routeVisible && nuevo.nombre !== "Oruro") {
    await fetchOsmRoute();
    drawSelectionEffects();
  }
}

function centrarMapa() {
  if (!map) return;
  const bounds = L.latLngBounds(municipios.map(m => m.coords));
  map.fitBounds(bounds.pad(0.18), { animate: true });
}

async function handleSearchInput(event) {
  const term = event.target.value.trim();

  clearTimeout(searchTimeout);

  const dropdown = $("#searchDropdown");
  if (!term) {
    if (dropdown) dropdown.remove();
    searchResults = [];
    return;
  }

  if (term.length < 3) return;

  searchTimeout = setTimeout(async () => {
    const local = visibles().filter(m =>
      limpiar(m.nombre).includes(limpiar(term)) ||
      limpiar(m.provincia).includes(limpiar(term))
    );

    const osmResults = await OsmServices.searchNominatim(term, 3);

    const combined = [
      ...local.slice(0, 3).map(m => ({
        type: "local",
        display: m.nombre,
        lat: m.coords[0],
        lon: m.coords[1],
        subtitle: m.provincia
      })),
      ...osmResults.map(r => ({
        type: "osm",
        display: r.display.split(",").slice(0, 2).join(","),
        lat: r.lat,
        lon: r.lon,
        subtitle: r.type
      }))
    ].slice(0, 5);

    searchResults = combined;

    if (!dropdown) {
      const newDropdown = document.createElement("div");
      newDropdown.id = "searchDropdown";
      newDropdown.className = "search-dropdown";
      event.target.parentElement.appendChild(newDropdown);
    }

    const updatedDropdown = $("#searchDropdown");
    if (!updatedDropdown) return;

    if (!combined.length) {
      updatedDropdown.innerHTML = `<div class="search-no-results">Sin resultados</div>`;
      return;
    }

    updatedDropdown.innerHTML = combined.map((r, i) => `
      <button class="search-result" type="button" data-index="${i}">
        <span class="result-icon">${r.type === "local" ? "📍" : "🌐"}</span>
        <span class="result-text">
          <strong>${escapeHTML(r.display)}</strong>
          <small>${escapeHTML(r.subtitle)}</small>
        </span>
      </button>
    `).join("");

    $$(".search-result").forEach(btn => {
      btn.addEventListener("click", () => {
        const result = searchResults[Number(btn.dataset.index)];
        if (result.type === "local") {
          seleccionar(municipios.find(m =>
            limpiar(m.nombre).includes(limpiar(result.display)) ||
            limpiar(m.provincia).includes(limpiar(result.subtitle))
          )?.id || seleccionado.id);
        } else {
          if (map) {
            map.flyTo([result.lat, result.lon], 13, { duration: 0.8 });
          }
        }
        event.target.value = "";
        const drop = $("#searchDropdown");
        if (drop) drop.remove();
        searchResults = [];
      });
    });
  }, 300);
}

function setupEvents() {
  $("#statusFilter").addEventListener("change", (event) => {
    filtroEstado = event.target.value;
    const lista = visibles();
    if (!lista.some(m => m.id === seleccionado.id) && lista.length) seleccionado = lista[0];
    renderAll();
    centrarMapa();
  });

  $("#searchInput").addEventListener("input", handleSearchInput);

  document.addEventListener("click", (event) => {
    const dropdown = $("#searchDropdown");
    if (dropdown && !event.target.closest(".searchbox")) {
      dropdown.remove();
    }
  });

  $("#centerBtn").addEventListener("click", centrarMapa);

  $("#toggleRouteBtn").addEventListener("click", async () => {
    routeVisible = !routeVisible;
    $("#toggleRouteBtn").textContent = routeVisible ? "Ocultar línea" : "Mostrar línea";
    if (routeVisible && seleccionado.nombre !== "Oruro") {
      await fetchOsmRoute();
    }
    drawSelectionEffects();
  });

  $("#fullscreenBtn").addEventListener("click", () => {
    $("#mapCard").classList.toggle("full");
    setTimeout(() => map?.invalidateSize(), 260);
  });

  $("#themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  $("#prevPhoto").addEventListener("click", () => {
    fotoActual = (fotoActual - 1 + seleccionado.fotos.length) % seleccionado.fotos.length;
    renderGaleria();
  });

  $("#nextPhoto").addEventListener("click", () => {
    fotoActual = (fotoActual + 1) % seleccionado.fotos.length;
    renderGaleria();
  });

  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-select]");
    if (btn) seleccionar(btn.dataset.select);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $("#mapCard").classList.contains("full")) {
      $("#mapCard").classList.remove("full");
      setTimeout(() => map?.invalidateSize(), 260);
    }
  });
}

function addStyleSelector() {
  const container = document.createElement("div");
  container.className = "style-selector";
  container.innerHTML = `
    <span class="style-label">Capa:</span>
    <button class="style-btn active" data-style="osm" type="button">OSM</button>
    <button class="style-btn" data-style="dark" type="button">Oscuro</button>
    <button class="style-btn" data-style="satellite" type="button">Satélite</button>
    <button class="style-btn" data-style="topo" type="button">Topo</button>
  `;

  $(".map-controls").appendChild(container);

  $$(".style-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      applyTileLayer(btn.dataset.style);
    });
  });
}

function addComplementaryLayersControl() {
  const container = document.createElement("div");
  container.className = "layers-control";
  container.innerHTML = `
    <span class="layers-label">Capas:</span>
    <label class="layer-toggle">
      <input type="checkbox" data-layer="polygons" checked /> Polígonos
    </label>
  `;

  $(".map-controls").appendChild(container);

  $("input[data-layer='polygons']").addEventListener("change", (e) => {
    if (polygonLayer) {
      if (e.target.checked) {
        map.addLayer(polygonLayer);
      } else {
        map.removeLayer(polygonLayer);
      }
    }
  });
}

function start() {
  initMap();
  renderAll();
  setupEvents();
  addStyleSelector();
  addComplementaryLayersControl();
  setTimeout(centrarMapa, 250);
  setTimeout(fetchOsmRoute, 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}