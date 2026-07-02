# SDOP Oruro - Mapa territorial interactivo

Prototipo web para una carátula territorial del Gobierno Autónomo Departamental de Oruro.

## Qué incluye

- Mapa dinámico con 35 puntos municipales.
- Buscador por municipio, provincia, unidad responsable o proyecto.
- Filtro por estado: normal, observado, alerta y concluido.
- Ficha lateral del municipio seleccionado.
- Línea de conexión desde la ciudad de Oruro al municipio seleccionado.
- Círculo de enfoque territorial.
- Popups de datos por punto.
- Chips de municipios relacionados por provincia.
- Galería visual por municipio.
- Pantalla completa del mapa.
- Modo claro / oscuro.

## Cómo probar

Abre `index.html` en un navegador con conexión a internet.

## Siguiente fase recomendada

Los puntos municipales están mejor posicionados para prototipo visual y funcional. Para una versión final con precisión catastral o límites reales por municipio, se debe reemplazar la capa de puntos por un archivo oficial `GeoJSON` o `Shapefile` convertido a `GeoJSON`.

Estructura sugerida para producción:

```text
assets/data/oruro-municipios.geojson
assets/data/proyectos.json
assets/photos/municipios/
```

Así el mapa podrá mostrar polígonos clickeables reales, capas por estado, proyectos georreferenciados y reportes conectados al backend.
