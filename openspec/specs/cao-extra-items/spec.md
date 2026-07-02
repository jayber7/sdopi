# CAO Extra Items

## Purpose
Define la capacidad de agregar items adicionales en un CAO que no existen en la Planilla Base, para cubrir trabajos extra del período.

## Requirements

### Requirement: Items extra en CAO
Un CAO puede contener items que no existen en la Planilla Base (items adicionales del período). Estos items se crean sin `itemId` (similares a items extra).

#### Scenario: Agregar item extra a CAO
- **WHEN** un operador agrega un item nuevo a un CAO en estado borrador
- **THEN** el item se crea sin `itemId`, con `rubroCodigo` y `rubroNombre` propios
- **AND** en el grid se muestra sin datos "Según Contrato"

### Requirement: Items extra en aprobación
Al aprobar un item extra (sin itemId), el sistema crea automáticamente un nuevo Item en el proyecto y lo vincula al AvanceItem.

#### Scenario: Aprobar item extra
- **WHEN** un admin aprueba un item extra en un CAO
- **THEN** se crea un nuevo Item con los datos del AvanceItem (descripcion, unidad, precioUnitario, cantidadContrato)
- **AND** se crea un Rubro nuevo si el rubroCodigo no existe en el proyecto
- **AND** el AvanceItem queda vinculado al nuevo Item (itemId actualizado)
