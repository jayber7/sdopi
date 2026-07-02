# Delta for Planillas

## ADDED Requirements

### Requirement: Planilla Grid View
The system SHALL display planilla items in a grid grouped by rubro, with subtotals per rubro.

#### Scenario: View planilla grid
- GIVEN an authenticated user
- WHEN the user selects a project and a planilla
- THEN items are displayed in rows grouped by rubro
- AND each row shows: N°, descripcion, unidad, precioUnitario, cantidadContrato, montoOriginal, cantidadEjecutada, montoEjecutado, avancePct
- AND each rubro group shows a subtotal row

### Requirement: Create Planilla
The system SHALL allow creating a new planilla with all items initialized to 0.

### Requirement: Edit Planilla Items
The system SHALL allow editing cantidadEjecutada for each item, recalculating monto and avancePct.

### Requirement: Delete Planilla
The system SHALL allow deleting a planilla and its associated avances.
