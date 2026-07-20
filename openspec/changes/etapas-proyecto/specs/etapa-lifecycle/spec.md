## ADDED Requirements

### Requirement: Situación actual del proyecto (EtapaProyecto)
El `Proyecto` SHALL tener un campo `situacion` opcional de tipo `EtapaProyecto` (enum). La situación indica la etapa en que se encuentra el proyecto dentro de su ciclo de vida.

#### Scenario: Crear proyecto sin situación
- **WHEN** se crea un proyecto nuevo sin especificar situación
- **THEN** su `situacion` es `null`/`''` (sin especificar)

#### Scenario: Crear proyecto con situación
- **WHEN** se crea un proyecto nuevo con `situacion` especificada
- **THEN** el campo se guarda como el valor del enum correspondiente

### Requirement: Valores del enum EtapaProyecto
El sistema SHALL definir los siguientes valores en el enum `EtapaProyecto`:
`SIN_EJECUCION`, `PREINVERSION`, `INVERSION`, `CAMBIO_PREINVERSION_A_INVERSION`, `INVERSION_PARA_LICITACION`, `EDTP_CONCLUIDO`, `EDTP_CONCLUIDO_ESPERA_INVERSION`, `EN_EJECUCION`, `EN_CIERRE`, `CONCLUIDO`, `CON_ENTREGA_DEFINITIVA`, `CONCILIACION_SALDOS`, `AUDITORIA_EXTERNA`, `SUSPENSION_CONTRATACION`.

### Requirement: Situación editable
La situación del proyecto SHALL ser modificable sin restricciones de secuencia. A diferencia de un lifecycle estricto, el usuario puede cambiar a cualquier valor del enum en cualquier momento.

#### Scenario: Cambiar situación libremente
- **WHEN** un admin cambia `situacion` de `EN_EJECUCION` a `PREINVERSION`
- **THEN** el cambio se guarda sin restricciones
