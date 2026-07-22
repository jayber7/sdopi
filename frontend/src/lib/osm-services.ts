const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const OSRM_URL = 'https://router.project-osrm.org';

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
