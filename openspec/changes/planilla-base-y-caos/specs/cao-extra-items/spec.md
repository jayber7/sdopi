## ADDED Requirements

### Requirement: Items extra en CAO
Un CAO puede contener items que no existen en la Planilla Base (items adicionales del período). Estos items se crean sin `itemId` (similares a items extra actuales).

#### Scenario: Agregar item extra a CAO
- **WHEN** un operador agrega un item nuevo a un CAO en estado borrador
- **THEN** el item se crea sin `itemId`, con `rubroCodigo` y `rubroNombre` propios. En el grid se muestra sin datos "Según Contrato".
