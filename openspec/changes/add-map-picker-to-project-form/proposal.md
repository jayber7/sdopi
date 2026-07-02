## Why

Actualmente, al crear o editar un proyecto, las coordenadas (latitud/longitud) deben ingresarse manualmente como números. Esto es propenso a errores (signo incorrecto, coordenadas invertidas) y poco intuitivo para usuarios no técnicos. Un mapa interactivo donde el usuario puede hacer clic para seleccionar la ubicación del proyecto mejora la precisión y la experiencia de uso.

## What Changes

- Reemplazar los inputs numéricos de latitud/longitud en el modal de proyecto (creación y edición) por un mapa Leaflet interactivo con marcador arrastrable
- Agregar campo de búsqueda por geocoding (Nominatim) para ubicar rápidamente una dirección
- El mapa se muestra solo cuando el usuario selecciona el modo "Coordenadas" (convive con el modo "Calles")
- Los inputs numéricos se mantienen visibles debajo del mapa para edición manual fina
- Reverse geocoding: al colocar un marcador, se consulta Nominatim para rellenar automáticamente `direccion`
- El backend no requiere cambios (ya acepta latitud/longitud opcionales como Float)

## Capabilities

### New Capabilities
- `map-picker`: Selector de coordenadas mediante mapa Leaflet interactivo en el formulario de proyecto

### Modified Capabilities
- `proyecto`: El formulario de creación/edición ahora incluye mapa interactivo en modo coordenadas

## Impact

- **Frontend**: Se modifica el modal de proyecto en `page.tsx` y `[id]/page.tsx`
- **Dependencias**: `leaflet` y `@types/leaflet` ya instalados
- **API externa**: Nominatim (OSM) para geocoding — gratuito, sin API key
- **No hay cambios en backend ni en BD**
