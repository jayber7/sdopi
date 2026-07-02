# Planilla Base

## Purpose
Define la Planilla Base por proyecto, que contiene los datos contractuales "Según Contrato" (precioUnitario, cantidadContrato, montoOriginal) y sirve como referencia para todos los CAOs. La Base es también el punto único de gestión de rubros e items del proyecto.

## Requirements

### Requirement: Creación automática de Planilla Base
Cada proyecto tiene una única Planilla Base. Se crea automáticamente al registrar el proyecto.

#### Scenario: Auto-crear Planilla Base al registrar proyecto
- **WHEN** un admin registra un nuevo proyecto (POST /proyectos)
- **THEN** se crea automáticamente una Planilla Base vacía (sin AvanceItems) con tipo BASE, en estado `borrador`
- **AND** la Base usa como fechas `ordenProceder` y `fechaConclusion` del proyecto

#### Scenario: Sincronización al importar catálogo
- **WHEN** un admin u operador importa items del catálogo en un proyecto con Base existente
- **THEN** se crean rubros e items en el proyecto
- **AND** se crea automáticamente un AvanceItem por cada item importado en la Base

#### Scenario: Items creados manualmente requieren Refrescar Base
- **WHEN** un admin u operador crea un item manualmente (POST /items)
- **THEN** el item no aparece automáticamente en el grid de la Base
- **AND** debe hacer clic en "Refrescar Base" para sincronizar

### Requirement: Gestión de Rubros e Items en la Base
La Planilla Base integra la gestión de rubros e items. Toda la funcionalidad CRUD de rubros/items se realiza desde la vista de la Base.

#### Scenario: Crear rubro desde Base
- **WHEN** un admin u operador usa el formulario de la vista Base
- **THEN** se crea un nuevo rubro en el proyecto (POST /rubros)

#### Scenario: Editar rubro
- **WHEN** un admin u operador edita un rubro desde la vista Base
- **THEN** se actualiza el código y/o nombre del rubro (PATCH /rubros/:id)

#### Scenario: Eliminar rubro
- **WHEN** un admin u operador elimina un rubro desde la vista Base
- **THEN** si el rubro tiene AvanceItems en planillas en estado enviado o aprobado, se rechaza con error
- **AND** si solo tiene AvanceItems en planillas borrador, se eliminan esos AvanceItems, todos los items del rubro, y el rubro mismo (DELETE /rubros/:id)

#### Scenario: Crear item
- **WHEN** un admin u operador crea un item desde la vista Base
- **THEN** se crea el item con rubroId, numero, descripcion, unidad, precioUnitario, cantidadContrato (POST /items)

#### Scenario: Editar item en Base
- **WHEN** la Base está en estado borrador y un admin u operador edita PU o Cant.Contrato en el grid de la Base
- **THEN** se actualiza el AvanceItem directamente (PATCH /planillas/:id/items)

#### Scenario: Lock después de guardar en Base
- **WHEN** un operador hace clic en 💾 para guardar un item
- **THEN** el item se marca como guardado (locked)
- **AND** los inputs de PU y Cant.Contrato para ese item se reemplazan por texto plano
- **AND** el botón 💾 cambia a ✎ (editar)
- **WHEN** el operador hace clic en ✎
- **THEN** el item vuelve a estado editable con los valores actuales cargados en los inputs

#### Scenario: Eliminar item
- **WHEN** un admin u operador elimina un item desde la gestión de rubros en la Base
- **THEN** si el item tiene AvanceItems en planillas en estado enviado o aprobado, se rechaza con error
- **AND** si solo tiene AvanceItems en planillas borrador, se eliminan esos AvanceItems y el item (DELETE /items/:id)

### Requirement: Sincronización Base — Items
Cuando se agregan rubros/items mediante el gestor de rubros integrado en la Base, los nuevos items no aparecen automáticamente en el grid de la Base hasta que se sincronizan.

#### Scenario: Refrescar Base desde Items
- **WHEN** un admin u operador hace clic en "Refrescar Base"
- **THEN** se eliminan AvanceItems huérfanos (items que ya no existen en el proyecto)
- **AND** se crean AvanceItems para items nuevos que no tenían representación en la Base
- **AND** los AvanceItems existentes con datos personalizados (PU/CC editados) no se sobrescriben

### Requirement: Workflow de Planilla Base
La Planilla Base sigue el flujo: borrador → enviado → aprobado. Los datos "Según Contrato" solo son editables en estado borrador.

#### Scenario: Enviar Base a aprobación
- **WHEN** un operador hace clic en "Enviar para Aprobacion" en la Base
- **THEN** la Base pasa a estado `enviado`
- **AND** los items dejan de ser editables

#### Scenario: Admin revisa items individualmente
- **WHEN** un admin ve la Base en estado `enviado`
- **THEN** cada item pendiente muestra botones Ok (aprobar) y X (rechazar) en la columna Acción
- **AND** items ya aprobados se muestran en verde con texto "Aprobado"
- **AND** items ya rechazados se muestran en rojo con texto "Rechazado"
- **AND** items pendientes tienen fondo amarillo

#### Scenario: Aprobar item individual
- **WHEN** un admin hace clic en Ok en un item pendiente
- **THEN** el item se marca como `aprobado: true`
- **AND** los botones Ok/X desaparecen para ese item
- **AND** el texto cambia a "Aprobado" en verde

#### Scenario: Rechazar item individual
- **WHEN** un admin hace clic en X en un item pendiente
- **THEN** el item se marca como `aprobado: false`
- **AND** el texto cambia a "Rechazado" en rojo con fondo rojo claro

#### Scenario: Aprobar Todo
- **WHEN** un admin hace clic en "Aprobar Todo"
- **THEN** los items extra (itemId=null) se aprueban individualmente con try/catch por cada uno
- **AND** mediante updateMany todos los items con `aprobado: null` o `aprobado: false` se marcan como `aprobado: true`
- **AND** la Base/CAO pasa a estado `aprobado`
- **AND** aparece el banner verde: "Planilla aprobada. Todos los items han sido verificados."

#### Scenario: Devolver a Borrador
- **WHEN** la Base está en estado `enviado` y hay items rechazados
- **THEN** aparece el botón "Devolver a Borrador"
- **WHEN** un admin hace clic en "Devolver a Borrador"
- **THEN** los items rechazados se resetean a `aprobado: null`
- **AND** la Base vuelve a estado `borrador`
- **AND** los items aprobados permanecen como `aprobado: true`

#### Scenario: Items aprobados no son editables en borrador
- **WHEN** la Base está en estado `borrador` después de un "Devolver a Borrador"
- **THEN** los items con `aprobado: true` se muestran como read-only (sin inputs ni botón Guardar)
- **AND** solo los items con `aprobado: null` (los que fueron rechazados y reseteados) son editables
- **AND** el banner amarillo indica: "El administrador ha rechazado algunos items. Revise y corrija los items marcados en rojo"

### Requirement: Eliminación de planillas
#### Scenario: Bloquear eliminación de Base con CAOs
- **WHEN** un admin intenta eliminar una Planilla Base con CAOs vinculados
- **THEN** se rechaza con error "No se puede eliminar la Planilla Base porque tiene CAOs vinculados"

#### Scenario: Bloquear eliminación fuera de borrador
- **WHEN** un admin intenta eliminar cualquier planilla en estado enviado o aprobado
- **THEN** se rechaza con error "Solo se puede eliminar en estado borrador"

### Requirement: Limpieza de AvanceItems huérfanos
#### Scenario: Endpoint cleanup-orphans
- **WHEN** un admin envía POST /api/planillas/cleanup-orphans
- **THEN** se eliminan AvanceItems con itemId=null, rubroCodigo=null y descripcion=null
- **AND** retorna { deleted: N }

### Requirement: Visualización de Planilla Base
La Planilla Base se muestra en la interfaz con una marca distintiva (badge "BASE"). Arriba del grid se muestra el gestor de rubros.

#### Scenario: Ver Planilla Base
- **WHEN** un usuario selecciona una Planilla Base
- **THEN** se muestra un badge azul "BASE" con el título "Planilla Base — Datos Según Contrato"
- **AND** arriba del grid se muestra el gestor de rubros e items (RubrosManager) solo cuando la Base está en estado borrador o enviado (oculto en aprobado)
- **AND** abajo se muestra el grid con columnas: N°, Desc, Und, P.Unit., Cant.Cont., M.Orig., Estado, Acción
- **AND** items agrupados por rubro
- **AND** al final del grid se muestra fila "TOTAL" con la suma de Monto Original de todos los rubros
- **AND** la columna Estado muestra símbolos (✓/✗/○) en vez de texto
- **AND** la columna Und tiene ancho reducido (36px)
