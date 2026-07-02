## ADDED Requirements

### Requirement: Selector de etapa en formulario
El formulario de creación y edición de proyecto SHALL incluir un selector (dropdown) para la etapa actual con los valores: "Estudio", "Inversión", "Ejecución", "Concluido". Solo se mostrarán las etapas válidas según la etapa actual (secuenciales, sin retroceder).

#### Scenario: Crear proyecto
- **WHEN** un operador crea un proyecto
- **THEN** el campo etapa muestra solo "Estudio" como opción (default)

#### Scenario: Editar proyecto en estudio
- **WHEN** un admin edita un proyecto con `etapaActual="estudio"`
- **THEN** el dropdown muestra como opciones: "Estudio" (actual), "Inversión" (siguiente)

#### Scenario: Editar proyecto en ejecución
- **WHEN** un admin edita un proyecto con `etapaActual="ejecucion"`
- **THEN** el dropdown muestra: "Ejecución" (actual), "Concluido" (siguiente)

### Requirement: Badge de etapa en lista de proyectos
La lista de proyectos SHALL mostrar un badge/etiqueta con la etapa actual del proyecto (ej: "Estudio", "Ejecución") con un color distintivo para cada etapa.

#### Scenario: Lista con etapa
- **WHEN** un usuario ve la lista de proyectos
- **THEN** cada proyecto muestra un badge con su etapa actual

### Requirement: Etapa en detalle de proyecto
La cabecera del detalle de proyecto SHALL mostrar la etapa actual junto al nombre.

#### Scenario: Detalle de proyecto
- **WHEN** un usuario abre el detalle de un proyecto
- **THEN** la cabecera muestra el nombre y la etapa actual

### Requirement: Ocultar botón "+ Nueva" planilla según etapa
El botón "+ Nueva" para crear planillas CAO SHALL ocultarse si el proyecto no está en etapa "ejecución". La Planilla BASE sí puede crearse en cualquier etapa.

#### Scenario: Proyecto en estudio sin botón CAO
- **WHEN** un operador ve la sección de planillas de un proyecto en `"estudio"`
- **THEN** NO se muestra el botón "+ Nueva"
- **AND** se muestra un mensaje "Las planillas CAO están disponibles cuando el proyecto esté en Ejecución"
