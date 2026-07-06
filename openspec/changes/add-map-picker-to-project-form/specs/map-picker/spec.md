## ADDED Requirements

### Requirement: Mapa interactivo para selección de coordenadas

El sistema SHALL mostrar un mapa Leaflet interactivo debajo de los selects de provincia/municipio en el formulario de proyecto, permitiendo seleccionar la ubicación del proyecto mediante clic o arrastre de marcador.

#### Scenario: MapPicker se muestra en el formulario
- GIVEN el modal de creación/edición de proyecto está abierto
- THEN se muestran los selects de provincia y municipio
- THEN debajo se muestra un mapa Leaflet interactivo centrado en Oruro (default: -17.983, -67.15, zoom 7)
- AND debajo del mapa se muestran los inputs numéricos de latitud y longitud

#### Scenario: Seleccionar coordenadas con clic en el mapa
- WHEN el usuario hace clic en un punto del mapa
- THEN se coloca un marcador en esa posición
- AND los inputs de latitud y longitud se actualizan con las coordenadas del clic
- AND se inicia una consulta reverse geocoding a Nominatim

#### Scenario: Mover marcador arrastrándolo
- GIVEN un marcador existente en el mapa
- WHEN el usuario arrastra el marcador a una nueva posición
- THEN los inputs de latitud y longitud se actualizan con la nueva posición
- AND se inicia una consulta reverse geocoding

#### Scenario: Reverse geocoding rellena dirección
- WHEN se coloca o mueve un marcador en el mapa
- THEN el sistema consulta Nominatim `/reverse?lat=...&lon=...&format=json`
- AND si la consulta es exitosa, el campo `direccion` se rellena con `display_name`
- AND si la consulta falla (rate limit, red), el campo `direccion` no se modifica

#### Scenario: Editar coordenadas manualmente
- GIVEN el mapa visible con un marcador
- WHEN el usuario modifica el valor del input de latitud o longitud
- THEN el marcador se mueve a la nueva posición en el mapa
- AND el mapa se centra en la nueva posición

#### Scenario: Precargar coordenadas en edición
- GIVEN un proyecto existente con `latitud` y `longitud` no nulos
- WHEN el usuario abre el modal de edición
- THEN el mapa se centra en las coordenadas del proyecto
- AND se coloca un marcador en esa posición

#### Scenario: Búsqueda por geocoding
- WHEN el usuario escribe en el campo de búsqueda sobre el mapa y presiona Enter
- THEN el sistema consulta Nominatim `/search?q=...&format=json&limit=5`
- AND muestra los resultados como opciones seleccionables
- AND al seleccionar un resultado, el mapa se centra ahí y se coloca el marcador
