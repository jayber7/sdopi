## ADDED Requirements

### Requirement: Selección de ubicación con provincia, municipio y mapa interactivo

El formulario de creación y edición de proyecto SHALL incluir selects de provincia y municipio (en ese orden) seguidos de un mapa Leaflet interactivo para seleccionar la ubicación del proyecto.

#### Scenario: Seleccionar provincia y municipio centra el mapa
- GIVEN el modal de nuevo proyecto está abierto
- WHEN el usuario selecciona una provincia
- THEN el select de municipios se filtra mostrando solo los de esa provincia
- AND los campos latitud, longitud y dirección se limpian
- WHEN el usuario selecciona un municipio
- THEN el mapa se centra en las coordenadas del municipio
- AND se coloca un marcador en esa posición
- AND los inputs de latitud y longitud se actualizan con las coordenadas del municipio
- AND se consulta Nominatim (reverse geocoding) para obtener la dirección
- AND si hay resultado, el campo "Calles / Ubicación" se rellena automáticamente

#### Scenario: Ajustar coordenadas con clic en el mapa
- GIVEN el mapa centrado en un municipio con marcador visible
- WHEN el usuario hace clic en un punto del mapa
- THEN el marcador se mueve a la nueva posición
- AND los inputs de latitud y longitud se actualizan
- AND se inicia reverse geocoding para actualizar la dirección

#### Scenario: Arrastrar marcador
- GIVEN un marcador existente en el mapa
- WHEN el usuario arrastra el marcador a una nueva posición
- THEN los inputs de latitud y longitud se actualizan con la nueva posición
- AND se inicia reverse geocoding

#### Scenario: Búsqueda por geocoding
- WHEN el usuario escribe en el campo de búsqueda sobre el mapa y presiona Enter
- THEN el sistema consulta Nominatim `/search?q=...`
- AND muestra los resultados como opciones seleccionables
- AND al seleccionar un resultado, el mapa se centra ahí, se coloca el marcador y se actualizan inputs

#### Scenario: Editar coordenadas manualmente
- GIVEN el mapa visible con un marcador
- WHEN el usuario modifica el valor del input de latitud o longitud
- THEN el marcador se mueve a la nueva posición en el mapa
- AND el mapa se centra en la nueva posición

## MODIFIED Requirements

### Requirement: Interfaz de Lista — Crear desde la lista

#### Scenario: Crear desde la lista (MODIFIED)
- **WHEN** un admin u operador hace clic en "Nuevo Proyecto"
- **THEN** se abre un modal con todos los campos del proyecto
- **AND** el modal incluye selects de provincia/municipio seguidos de un mapa Leaflet
- **AND** al guardar exitosamente, la lista se refresca automáticamente

### Requirement: Interfaz de Detalle — Editar desde el detalle

#### Scenario: Editar desde el detalle (MODIFIED)
- **WHEN** un admin u operador hace clic en "Editar proyecto" en la cabecera
- **THEN** se abre el modal de edición con los datos precargados
- **AND** si el proyecto tiene coordenadas, el mapa se centra en ellas con marcador
- **AND** la provincia y municipio se preseleccionan si el proyecto los tiene
- **AND** al guardar, la vista se actualiza con los nuevos datos
