## Context

El formulario de proyecto (creación y edición) tiene un toggle "Calles" / "Coordenadas". En modo coordenadas actualmente solo hay dos inputs numéricos. El proyecto ya usa Leaflet v1.9.4 con OpenStreetMap en el mapa portal (`/mapa`). Se reutilizará el mismo stack para el picker.

Los modales de creación y edición están en dos archivos separados:
- `frontend/src/app/proyectos/page.tsx` — modal de creación
- `frontend/src/app/proyectos/[id]/page.tsx` — modal de edición

Ambos modales tienen el mismo patrón de toggle y los mismos campos.

## Goals / Non-Goals

**Goals:**
- Reemplazar los inputs de lat/lng por un mapa Leaflet interactivo
- Soporte para clic en mapa y marcador arrastrable
- Búsqueda por geocoding (Nominatim)
- Reverse geocoding para rellenar dirección automáticamente
- Mantener inputs numéricos visibles para edición manual
- Funcionar tanto en creación como en edición (con coordenadas precargadas)

**Non-Goals:**
- No se modifica el backend ni la BD
- No se agregan dependencias nuevas (Leaflet ya instalado)
- No se modifica el modo "Calles"
- No se agrega soporte para polígonos o rutas

## Decisions

1. **Componente reutilizable `MapPicker`**: Se crea un único componente que se importa tanto en `page.tsx` como en `[id]/page.tsx`. Props: `lat?, lng?, onChange(lat, lng)`. Así evitamos duplicar el mapa en dos archivos.

2. **Leaflet directo (no react-leaflet)**: El proyecto ya usa Leaflet directo con refs (`L.map`, `L.tileLayer`). Seguir el mismo patrón para consistencia. No instalar `react-leaflet`.

3. **Dynamic import con SSR=false**: El mapa solo funciona en cliente. Se importa con `dynamic(() => import('./MapPicker'), { ssr: false })` igual que `MapaPortalWrapper`.

4. **Nominatim para geocoding**: Misma API que ya se usa en `osm-services.ts` para el mapa portal. Límite de 1 req/segundo (respetar con delay). Gratuito, sin API key.

5. **Marcador arrastrable**: `L.marker({ draggable: true })`. Al soltar el marcador, se actualizan lat/lng y se hace reverse geocoding.

6. **Reverse geocoding**: Nominatim `/reverse?lat=...&lon=...`. El resultado `display_name` se pasa al padre mediante `onReverseGeocode(direccion)` para llenar el campo dirección.

7. **Inputs numéricos visibles**: Debajo del mapa, sincronizados en ambos sentidos (cambio en input → mueve marcador, cambio en mapa → actualiza input).

## Risks / Trade-offs

- [Rate limiting Nominatim] → Respetar 1 req/s con setTimeout. Si falla, el marcador se coloca igual sin reverse geocoding.
- [SSR incompatibility] → Dynamic import con `ssr: false` como ya se hace en `MapaPortalWrapper`.
- [Leaflet icons rotos en build] → `L.Icon.Default.mergeOptions` con URLs explícitas, igual que en `MapaOruro.tsx`.
- [Modal con mapa se siente lento] → El mapa se inicializa solo cuando el usuario cambia a modo "Coordenadas", no al abrir el modal.
