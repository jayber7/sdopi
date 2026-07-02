## ADDED Requirements

### Requirement: Generar PDF Memorandum
El sistema SHALL generar un documento PDF con la siguiente estructura:
- Encabezado: "MEMORANDUM DE MULTA POR RETRASO"
- Código único de memorandum (ej: "MEM-001/2026")
- Datos del proyecto: nombre, contrato, contratista
- Datos del CAO: número, periodo, fechaInicio, fechaFin, estado actual
- Detalle de la multa:
  - Periodo de retraso (fechaInicio — fechaFin)
  - Días de retraso
  - Monto por día
  - Monto total
- Fecha de emisión
- Espacio para firmas

#### Scenario: Generar PDF exitosamente
- **WHEN** un admin hace clic en "Generar Memorandum" para una multa con código "MEM-001/2026"
- **THEN** el sistema genera y descarga un archivo PDF con nombre `MEM-001-2026.pdf`
- **AND** el PDF contiene los datos correctos de la multa y el proyecto

### Requirement: Código único de memorandum
Cada multa SHALL tener un `memorandumRef` único generado automáticamente con el formato `MEM-{correlativo}/{año}`.

#### Scenario: Generación de código correlativo
- **WHEN** se genera el primer memorandum del año 2026
- **THEN** su código es "MEM-001/2026"

#### Scenario: Correlativo incremental
- **WHEN** se genera un nuevo memorandum después de "MEM-005/2026"
- **THEN** su código es "MEM-006/2026"
