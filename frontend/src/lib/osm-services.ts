const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const OSRM_URL = 'https://router.project-osrm.org';

export async function getMunicipiosPolygons() {
  const query = `
[out:json][timeout:90];
rel["ISO3166-2"="BO-O"];
map_to_area->.dept;
rel(area.dept)["admin_level"="8"]["name"~"."];
out body geom;
`.trim();
  try {
    const r = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!r.ok) return null;
    const data = await r.json();
    const features = (data.elements || [])
      .filter((el: any) => el.type === 'relation' && el.members)
      .map((rel: any) => {
        const coords: [number, number][] = [];
        (rel.members || [])
          .filter((m: any) => m.type === 'way' && m.geometry)
          .forEach((m: any) => {
            m.geometry.forEach((p: any) => coords.push([p.lon, p.lat]));
          });
        return {
          type: 'Feature',
          properties: { id: rel.id, name: rel.tags?.name || rel.tags?.name_es || 'Municipio' },
          geometry: coords.length > 0 ? { type: 'Polygon', coordinates: [coords] } : null,
        };
      })
      .filter((f: any) => f.geometry !== null);
    return { type: 'FeatureCollection', features };
  } catch {
    return null;
  }
}

export async function reverseNominatim(lat: number, lon: number) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    addressdetails: '1',
  });
  try {
    const r = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
      headers: { 'User-Agent': 'SDOP-Oruro-Map/1.0' },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

export async function searchNominatim(term: string, limit = 5) {
  if (!term || term.length < 3) return [];
  const params = new URLSearchParams({
    q: `${term}, Oruro, Bolivia`,
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
    viewbox: '-68.5,-17.0,-66.5,-20.0',
    bounded: '1',
  });
  try {
    const r = await fetch(`${NOMINATIM_URL}/search?${params}`, {
      headers: { 'User-Agent': 'SDOP-Oruro-Map/1.0' },
    });
    if (!r.ok) return [];
    const results = await r.json();
    return results
      .map((r: any) => ({
        display: r.display_name,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        type: r.type,
        importance: r.importance,
      }))
      .sort((a: any, b: any) => b.importance - a.importance);
  } catch {
    return [];
  }
}

export async function getViasOruro() {
  const query = `
[out:json][timeout:90];
rel["ISO3166-2"="BO-O"];
map_to_area->.dept;
(
  way["highway"~"motorway|trunk|primary|secondary|tertiary"](area.dept);
);
out geom;
`.trim();
  try {
    const r = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!r.ok) return null;
    const data = await r.json();
    const features = (data.elements || [])
      .filter((el: any) => el.type === 'way' && el.geometry?.length > 1)
      .map((way: any) => ({
        type: 'Feature',
        properties: {
          highway: way.tags?.highway || 'unknown',
          name: way.tags?.name || null,
          ref: way.tags?.ref || null,
        },
        geometry: {
          type: 'LineString',
          coordinates: way.geometry.map((p: any) => [p.lon, p.lat]),
        },
      }));
    return { type: 'FeatureCollection', features };
  } catch {
    return null;
  }
}

export async function getRoute(from: [number, number], to: [number, number]) {
  const params = new URLSearchParams({ overview: 'full', geometries: 'geojson', steps: 'false' });
  const url = `${OSRM_URL}/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?${params}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    if (data.routes?.length > 0) {
      return { geometry: data.routes[0].geometry, distance: data.routes[0].distance, duration: data.routes[0].duration };
    }
    return null;
  } catch {
    return null;
  }
}
