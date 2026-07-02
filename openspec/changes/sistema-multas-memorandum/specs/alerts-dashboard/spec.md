## ADDED Requirements

### Requirement: Vista general de retrasos
El sistema SHALL mostrar en la lista de proyectos un indicador visual de retrasos activos. Cada proyecto con al menos un CAO en retraso SHALL mostrar:
- Días totales de retraso (suma de todos los CAOs no aprobados)
- Multa acumulada total (suma de montos de multas pendientes)
- Un badge/alerta visual (⚠️)

#### Scenario: Proyecto sin retrasos
- **WHEN** un proyecto tiene todos sus CAOs aprobados o dentro de plazo
- **THEN** la vista general NO muestra alerta de retraso
- **AND** muestra "Al día" o indicador verde

#### Scenario: Proyecto con retraso
- **WHEN** un proyecto tiene CAOs con fechaFin vencida no aprobados
- **THEN** la vista general muestra el total de días de retraso y multa acumulada
- **AND** muestra un badge de alerta

### Requirement: Vista detalle de CAO con retraso
En la vista detalle de un CAO (`/proyectos/[id]`), cuando el CAO está en retraso:
- Se muestra un bloque de alerta con:
  - "⚠️ RETRASO: X días"
  - "Multa acumulada: Y Bs"
  - Botón "Generar Memorandum PDF"
- Se listan las multas existentes del CAO con su detalle

#### Scenario: Ver CAO retrasado
- **WHEN** un operador/admin navega a un CAO con 30 días de retraso
- **THEN** la UI muestra el bloque de alerta con los días de retraso y monto acumulado
- **AND** muestra las multas ya generadas para ese CAO

### Requirement: Actualización dinámica sin recarga
Los contadores de retraso en la UI SHALL actualizarse al refrescar la planilla (sin necesidad de recargar la página completa).

#### Scenario: Refrescar planilla
- **WHEN** un operador hace clic en "💾" para guardar cantidades
- **THEN** el bloque de retraso/multa se recalcula con la nueva data
