## ADDED Requirements

### Requirement: CAO hereda items de Planilla Base
Al crear un CAO, se copian los AvanceItems de la Planilla Base (no los Items del proyecto). Los datos "Según Contrato" (PU, cantidadContrato, montoOriginal) se toman de la Base.

#### Scenario: Crear CAO desde Base
- **WHEN** un operador crea un CAO con `planillaBaseId` vinculado a una Base aprobada
- **THEN** se crean AvanceItems copiando itemId, descripcion, unidad, precioUnitario, cantidadContrato desde la Base, con cantidad=0

### Requirement: Grid con datos acumulativos
Cada item en un CAO muestra: Según Contrato (Base), Avance Anterior (CAOs aprobados previos), Avance Presente (este CAO), Avance Acumulado, % Periodo, % a la Fecha.

#### Scenario: Ver grid de CAO
- **WHEN** un usuario ve un CAO con `planillaBaseId`
- **THEN** el grid muestra: PU, Cant.Contrato, MontoOriginal | Cant.Anterior, MontoAnterior | Cant.Ejecutada, MontoEjecutado | Cant.Acumulada, MontoAcumulado | %Periodo | %Fecha

### Requirement: Cálculo de Avance Anterior
El "Avance Anterior" se calcula sumando cantidades y montos de CAOs anteriores aprobados que comparten el mismo `itemId`.

#### Scenario: Calcular avance anterior
- **WHEN** se carga un CAO N°3
- **THEN** Avance Anterior = suma de CAO N°1 y N°2 aprobados para cada item (matching por itemId)

### Requirement: Creación automática de CAO siguiente
Al aprobar una planilla (Base o CAO), se crea automáticamente el siguiente CAO en estado borrador.

#### Scenario: Aprobar Base crea CAO N°1
- **WHEN** un admin hace clic en "Aprobar Todo" en una Planilla Base
- **THEN** la Base se aprueba
- **AND** se crea automáticamente un CAO N°1 en estado borrador, copiando los items de la Base con cantidad=0
- **AND** el nuevo CAO aparece en la lista de planillas del proyecto

#### Scenario: Aprobar CAO N°(n) crea CAO N°(n+1)
- **WHEN** un admin hace clic en "Aprobar Todo" en un CAO N°1
- **THEN** el CAO N°1 se aprueba
- **AND** se crea automáticamente un CAO N°2 en estado borrador
- **AND** el nuevo CAO aparece en la lista de planillas del proyecto

### Requirement: Gran total en CAO
#### Scenario: Fila TOTAL al final del grid
- **WHEN** un usuario ve un CAO
- **THEN** al final del grid se muestra una fila "TOTAL" con el desglose completo: Contrato, Anterior, Presente, Acumulado, %Periodo, %Fecha
- **AND** las filas de subtotal por rubro fueron eliminadas
