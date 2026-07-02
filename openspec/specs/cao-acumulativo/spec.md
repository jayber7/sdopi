# CAO Acumulativo

## Purpose
Define cómo los CAOs heredan items de la Planilla Base y muestran datos acumulativos (avance anterior, presente, acumulado, porcentajes de periodo y a la fecha).

## Requirements

### Requirement: CAO hereda items de Planilla Base
Al crear un CAO, se copian los AvanceItems de la Planilla Base (no los Items del proyecto). Los datos "Según Contrato" (PU, cantidadContrato, montoOriginal) se toman de la Base.

#### Scenario: Crear CAO desde Base
- **WHEN** un operador crea un CAO con `planillaBaseId` vinculado a una Base aprobada
- **THEN** se crean AvanceItems copiando itemId, descripcion, unidad, precioUnitario, cantidadContrato desde la Base, con cantidad=0

#### Scenario: Base no aprobada
- **WHEN** un operador crea un CAO vinculado a una Planilla Base en estado borrador o enviado
- **THEN** se rechaza con error indicando que la Base debe estar aprobada

### Requirement: Grid con datos acumulativos
Cada item en un CAO muestra: Según Contrato (Base), Avance Anterior (CAOs aprobados previos), Avance Presente (este CAO), Avance Acumulado, % Periodo, % a la Fecha.

#### Scenario: Ver grid de CAO
- **WHEN** un usuario ve un CAO con `planillaBaseId`
- **THEN** el grid muestra las columnas agrupadas: Item (N°, Descripción, Und) | Según Contrato (PU, Cant.Contrato, MontoOriginal) | Avance Anterior (Cant., Monto) | Avance Presente (Cant., Monto) | Avance Acumulado (Cant., Monto) | % Periodo | % Fecha | Estado | Acción

### Requirement: Cálculo de Avance Anterior
El "Avance Anterior" se calcula sumando cantidades y montos de CAOs anteriores aprobados que comparten el mismo `itemId` y la misma `planillaBaseId`.

#### Scenario: Calcular avance anterior
- **WHEN** se carga un CAO N°3
- **THEN** Avance Anterior = suma de CAO N°1 y N°2 aprobados para cada item (matching por itemId)
- **AND** CAOs en estado borrador o enviado no se incluyen en el acumulado

#### Scenario: Avance Anterior se pierde al enviar
- **WHEN** un operador hace clic en "Enviar para Aprobación"
- **THEN** el backend actualiza el estado a `enviado`
- **AND** la respuesta incluye el campo `historico` con los cálculos de Avance Anterior
- **AND** el frontend conserva los valores correctos de Avance Anterior tras el cambio de estado

### Requirement: Edición de cantidad presente en CAO
En estado borrador, se puede editar la cantidad ejecutada del período (Avance Presente) para items con itemId. Items sin itemId (extra) permiten editar todos los campos.

#### Scenario: Editar cantidad en CAO
- **WHEN** un operador edita la cantidad ejecutada de un item en un CAO borrador
- **THEN** se actualiza el monto y porcentaje de avance del período

#### Scenario: Lock después de guardar en CAO
- **WHEN** un operador hace clic en 💾 para guardar la cantidad de un item
- **THEN** el item se marca como guardado (locked)
- **AND** el input de cantidad se reemplaza por texto plano
- **AND** el botón 💾 cambia a ✎ (editar)
- **WHEN** el operador hace clic en ✎
- **THEN** el item vuelve a estado editable con la cantidad actual cargada en el input

#### Scenario: Items aprobados no editables después de Devolver a Borrador
- **WHEN** un admin hace "Devolver a Borrador" en un CAO en estado enviado con items rechazados
- **THEN** los items con `aprobado: true` permanecen aprobados
- **AND** esos items aprobados se muestran como read-only en el grid (sin input de cantidad ni botones Guardar/X)
- **AND** solo los items reseteados a `aprobado: null` (ex-rechazados) son editables por el operador

### Requirement: Creación automática de CAO siguiente
Al aprobar una planilla (Base o CAO) mediante "Aprobar Todo", se crea automáticamente el siguiente CAO en estado borrador.

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

### Requirement: Gran total en grid de CAO
#### Scenario: Fila TOTAL al final del CAO
- **WHEN** un usuario ve cualquier CAO
- **THEN** al final del grid se muestra una fila "TOTAL" con desglose: Contrato, Anterior, Presente, Acumulado, %Periodo, %Fecha
- **AND** las filas de subtotal por rubro fueron eliminadas (anteriormente mostraban "Subtotal {codigo}")

### Requirement: Flujo de aprobación individual por item
El admin puede aprobar o rechazar cada item individualmente en un CAO en estado enviado. Esto permite revisión granular antes de aprobar la planilla completa.

#### Scenario: Admin ve botones Ok/X en CAO enviado
- **WHEN** un admin ve un CAO en estado `enviado`
- **THEN** cada item con `aprobado: null` muestra botones Ok (verde) y X (rojo) en la columna Acción
- **AND** items ya aprobados o rechazados muestran solo el texto de estado

#### Scenario: Aprobar item individual en CAO
- **WHEN** un admin hace clic en Ok en un item pendiente
- **THEN** se envía PATCH /planillas/:id/aprobar-item/:avanceId
- **AND** el item se muestra como "Aprobado" en verde sin botones

#### Scenario: Rechazar item individual en CAO
- **WHEN** un admin hace clic en X en un item pendiente
- **THEN** se envía PATCH /planillas/:id/rechazar-item/:avanceId
- **AND** el item se muestra como "Rechazado" en rojo con fondo rojo claro
- **AND** la planilla permanece en estado `enviado`
- **AND** aparece el botón "Devolver a Borrador" para el admin
