const OsmServices = {
  OVERPASS_URL: "https://overpass-api.de/api/interpreter",
  NOMINATIM_URL: "https://nominatim.openstreetmap.org",
  OSRM_URL: "https://router.project-osrm.org",

  async overpassQuery(query) {
    const response = await fetch(this.OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`
    });
    if (!response.ok) throw new Error(`Overpass error: ${response.status}`);
    return response.json();
  },

  async getMunicipiosPolygons() {
    const query = `
[out:json][timeout:60];
area["name"="Oruro"]->.dept;
rel(area.dept)["admin_level"="8"]["name"~"."];
out body geom;
`.trim();

    try {
      const data = await this.overpassQuery(query);
      const features = (data.elements || [])
        .filter(el => el.type === "relation" && el.members)
        .map(rel => {
          const coords = [];
          (rel.members || [])
            .filter(m => m.type === "way" && m.geometry)
            .forEach(m => {
              m.geometry.forEach(p => coords.push([p.lon, p.lat]));
            });
          return {
            type: "Feature",
            properties: {
              id: rel.id,
              name: rel.tags?.name || rel.tags?.name_es || "Municipio",
              admin_level: rel.tags?.admin_level
            },
            geometry: coords.length > 0 ? { type: "Polygon", coordinates: [coords] } : null
          };
        })
        .filter(f => f.geometry !== null);

      return { type: "FeatureCollection", features };
    } catch (e) {
      console.warn("Overpass fallback a puntos:", e);
      return null;
    }
  },

  async searchNominatim(term, limit = 5) {
    if (!term || term.length < 3) return [];
    const params = new URLSearchParams({
      q: term + ", Oruro, Bolivia",
      format: "json",
      addressdetails: 1,
      limit,
      viewbox: "-68.5,-17.0,-66.5,-20.0",
      bounded: 1
    });

    const response = await fetch(`${this.NOMINATIM_URL}/search?${params}`, {
      headers: { "User-Agent": "SDOP-Oruro-Map/1.0" }
    });
    if (!response.ok) return [];
    const results = await response.json();
    return results.map(r => ({
      display: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      type: r.type,
      importance: r.importance
    })).sort((a, b) => b.importance - a.importance);
  },

  async getRoute(from, to) {
    const params = new URLSearchParams({
      overview: "full",
      geometries: "geojson",
      steps: "false"
    });
    const url = `${this.OSRM_URL}/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?${params}`;

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      return {
        geometry: data.routes[0].geometry,
        distance: data.routes[0].distance,
        duration: data.routes[0].duration
      };
    }
    return null;
  },

  getTileLayers() {
    return {
      osm: {
        label: "OpenStreetMap",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: { maxZoom: 19, attribution: "© OpenStreetMap contributors" }
      },
      osmde: {
        label: "OpenStreetMap DE",
        url: "https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png",
        options: { maxZoom: 18, attribution: "© OpenStreetMap DE contributors" }
      },
      dark: {
        label: "Mapa oscuro",
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        options: { maxZoom: 19, attribution: "© CARTO" }
      },
      satellite: {
        label: "Satelital",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        options: { maxZoom: 18, attribution: "© Esri" }
      },
      topo: {
        label: "Topográfico",
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        options: { maxZoom: 17, attribution: "© OpenTopoMap" }
      }
    };
  },

  getComplementaryLayers() {
    return {
      highways: {
        label: "Carreteras",
        style: { color: "#f0c040", weight: 2, opacity: 0.7, fillOpacity: 0 }
      },
      rivers: {
        label: "Ríos",
        style: { color: "#38bdf8", weight: 2, opacity: 0.6, fillOpacity: 0 }
      },
      lakes: {
        label: "Lagos",
        style: { color: "#0ea5e9", weight: 1, opacity: 0.5, fillOpacity: 0.3 }
      }
    };
  }
};