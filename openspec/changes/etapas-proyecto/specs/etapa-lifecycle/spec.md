## ADDED Requirements

### Requirement: Etapa actual del proyecto
El `Proyecto` SHALL tener un campo `etapaActual` de tipo string con los valores permitidos: `"estudio"`, `"inversion"`, `"ejecucion"`, `"concluido"`. Valor por defecto: `"estudio"`.

#### Scenario: Proyecto nuevo
- **WHEN** se crea un proyecto nuevo
- **THEN** su `etapaActual` es `"estudio"`

### Requirement: Transiciones secuenciales
Las etapas SHALL seguir el orden: `estudio → inversion → ejecucion → concluido`. NO se puede retroceder a una etapa anterior. NO se puede saltar una etapa intermedia.

#### Scenario: Avanzar etapa válida
- **WHEN** un proyecto en `"estudio"` cambia a `"inversion"`
- **THEN** la transición es exitosa

#### Scenario: Retroceder etapa
- **WHEN** un proyecto en `"ejecucion"` intenta volver a `"inversion"`
- **THEN** el sistema rechaza con error "No se puede retroceder a una etapa anterior"

#### Scenario: Saltar etapa
- **WHEN** un proyecto en `"estudio"` intenta ir a `"ejecucion"`
- **THEN** el sistema rechaza con error "Debe pasar por la etapa inversion primero"

### Requirement: Historial de etapas
El sistema SHALL registrar cada transición de etapa en el modelo `EtapaProyecto` con:
- `proyectoId` (FK)
- `etapa` (string)
- `fechaInicio` (cuando se inició esta etapa)
- `fechaFin` (cuando terminó, null si es la actual)

#### Scenario: Registrar transición
- **WHEN** un proyecto pasa de `"estudio"` a `"inversion"`
- **THEN** se cierra la EtapaProyecto de "estudio" con `fechaFin`
- **AND** se crea una nueva EtapaProyecto para "inversion" con `fechaInicio`

### Requirement: Restricción de CAOs por etapa
El backend SHALL validar que solo proyectos en etapa `"ejecucion"` pueden crear planillas de tipo `CAO`. Si el proyecto está en otra etapa, la creación de CAO SHALL ser rechazada con error.

#### Scenario: Crear CAO en ejecución
- **WHEN** un operador crea un CAO en un proyecto con `etapaActual="ejecucion"`
- **THEN** el CAO se crea normalmente

#### Scenario: Crear CAO en estudio
- **WHEN** un operador intenta crear un CAO en un proyecto con `etapaActual="estudio"`
- **THEN** el sistema rechaza con error "Solo proyectos en ejecución pueden tener CAOs"

### Requirement: BASE planilla en cualquier etapa
La creación de Planilla BASE NO SHALL estar restringida por etapa. Puede crearse en cualquier etapa.

#### Scenario: Crear BASE en estudio
- **WHEN** un operador crea una Planilla BASE en un proyecto en `"estudio"`
- **THEN** la BASE se crea exitosamente
