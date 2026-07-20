## ADDED Requirements

### Requirement: Selector de situación en formulario
El formulario de creación y edición de proyecto SHALL incluir un selector (dropdown) para la situación/etapa actual, listando todos los valores de `EtapaProyecto` más una opción "Sin especificar".

#### Scenario: Crear proyecto
- **WHEN** un operador abre el modal de crear proyecto
- **THEN** el campo situación muestra "Sin especificar" como valor por defecto
- **AND** el dropdown lista los 14 valores del enum EtapaProyecto

#### Scenario: Editar proyecto con situación existente
- **WHEN** un admin edita un proyecto que tiene `situacion` asignada
- **THEN** el dropdown muestra el valor actual preseleccionado
- **AND** permite cambiar a cualquier otro valor

### Requirement: Situación en detalle de proyecto
La cabecera del detalle de proyecto SHALL mostrar la situación actual junto al nombre del proyecto.

#### Scenario: Detalle de proyecto con situación
- **WHEN** un usuario abre el detalle de un proyecto con `situacion` asignada
- **THEN** la cabecera muestra el nombre del proyecto y su situación
