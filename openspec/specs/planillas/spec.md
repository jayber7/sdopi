# Planillas

## Purpose
Gestiona el ciclo de vida de las planillas de certificación de avance de obra (CAO y Base), incluyendo creación, visualización en grid, edición de items, y eliminación. Es la capa fundamental sobre la que se construyen Planilla Base y CAO Acumulativo.

## Requirements

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

#### Scenario: Create planilla
- **WHEN** an admin or operador sends POST /api/planillas with proyectoId, tipo, numero, periodo, fechaInicio, fechaFin
- **THEN** a new planilla is created
- **AND** all existing project items are copied as AvanceItems with cantidad=0

### Requirement: Edit Planilla Items
The system SHALL allow editing cantidadEjecutada for each item, recalculating monto and avancePct.

#### Scenario: Edit item quantity
- **WHEN** an admin or operador edits the executed quantity of an item in a borrador planilla
- **THEN** the monto and avance percentage are recalculated
- **AND** the changes are persisted via PATCH /api/planillas/:id/items

### Requirement: Delete Planilla
The system SHALL allow deleting a planilla and its associated avances.

#### Scenario: Delete planilla
- **WHEN** an admin sends DELETE /api/planillas/:id
- **THEN** the planilla is deleted
- **AND** all associated AvanceItems are also deleted
