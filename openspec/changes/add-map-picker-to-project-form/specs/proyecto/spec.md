## ADDED Requirements

### Requirement: Mapa interactivo en formulario de proyecto

El formulario de creación y edición de proyecto SHALL incluir un mapa Leaflet interactivo en el modo "Coordenadas" para seleccionar la ubicación del proyecto mediante clic o arrastre del marcador.

#### Scenario: Seleccionar coordenadas desde el mapa en creación
- GIVEN el modal de nuevo proyecto está abierto
- WHEN el usuario selecciona modo "Coordenadas"
- THEN se muestra un mapa Leaflet debajo del toggle
- AND los inputs numéricos de latitud y longitud se mantienen visibles debajo del mapa
- WHEN el usuario hace clic en un punto del mapa
- THEN la latitud y longitud se actualizan en los inputs
- AND se coloca un marcador en la posición seleccionada

#### Scenario: Seleccionar coordenadas desde el mapa en edición
- GIVEN el modal de edición de proyecto está abierto con coordenadas existentes
- WHEN el usuario selecciona modo "Coordenadas"
- THEN el mapa se centra en las coordenadas del proyecto con un marcador en esa posición
- AND los inputs muestran los valores actuales
- WHEN el usuario arrastra el marcador a una nueva posición
- THEN los inputs se actualizan con las nuevas coordenadas

#### Scenario: Reverse geocoding al seleccionar ubicación
- WHEN el usuario selecciona una ubicación en el mapa (clic o arrastre)
- THEN el sistema consulta Nominatim para obtener la dirección
- AND si hay resultado, el campo "Calles / Ubicación" se rellena automáticamente
- AND el usuario puede modificar la dirección manualmente después

## MODIFIED Requirements

### Requirement: Interfaz de Lista — Crear desde la lista

El sistema SHALL permitir a admin y operador crear proyectos con todos los datos, incluyendo selección de ubicación mediante mapa interactivo.

#### Scenario: Crear desde la lista (MODIFIED)
- **WHEN** un admin u operador hace clic en "Nuevo Proyecto"
- **THEN** se abre un modal con todos los campos del proyecto
- **AND** el modal incluye un toggle Calles/Coordenadas con mapa Leaflet en modo coordenadas
- **AND** al guardar exitosamente, la lista se refresca automáticamente

### Requirement: Interfaz de Detalle — Editar desde el detalle

#### Scenario: Editar desde el detalle (MODIFIED)
- **WHEN** un admin u operador hace clic en "Editar proyecto" en la cabecera
- **THEN** se abre el modal de edición con los datos precargados
- **AND** si el proyecto tiene coordenadas, el toggle inicia en modo coordenadas con el mapa centrado en ellas
- **AND** al guardar, la vista se actualiza con los nuevos datos
