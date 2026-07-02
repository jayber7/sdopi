## ADDED Requirements

### Requirement: Creación automática de Planilla Base
Cada proyecto tiene una única Planilla Base. Se crea automáticamente al registrar el proyecto.

#### Scenario: Auto-crear Planilla Base al registrar proyecto
- **WHEN** un admin registra un nuevo proyecto (POST /proyectos)
- **THEN** se crea automáticamente una Planilla Base vacía (sin AvanceItems) con tipo BASE, en estado `borrador`

#### Scenario: Sincronización al importar catálogo
- **WHEN** un admin u operador importa items del catálogo
- **THEN** se crean rubros e items en el proyecto
- **AND** se crea automáticamente un AvanceItem por cada item importado en la Base

### Requirement: Base integra gestión de rubros
La gestión de rubros e items (antes pestaña Rubros) ahora se realiza desde la vista de la Planilla Base.

#### Scenario: CRUD rubros/items en Base
- **WHEN** un admin u operador ve la Planilla Base en estado borrador o enviado
- **THEN** arriba del grid se muestra el gestor de rubros (RubrosManager) con opciones de crear/editar/eliminar rubros e items, e importar del catálogo

#### Scenario: RubrosManager oculto en Base aprobada
- **WHEN** la Planilla Base está en estado aprobado
- **THEN** el RubrosManager no se muestra (solo se ve el grid read-only)

### Requirement: Sincronización Base — Items
Los items nuevos agregados vía RubrosManager se sincronizan con la Base mediante botón "Refrescar Base".

#### Scenario: Refrescar Base
- **WHEN** un admin u operador hace clic en "Refrescar Base"
- **THEN** se eliminan AvanceItems huérfanos y se crean AvanceItems para items nuevos

### Requirement: Items aprobados son read-only en borrador
Cuando un admin devuelve una planilla a borrador, los items aprobados no deben ser editables.

#### Scenario: Devolver a Borrador preserva items aprobados
- **WHEN** un admin hace clic en "Devolver a Borrador"
- **THEN** los items con aprobado=true permanecen aprobados
- **AND** en el grid, esos items no muestran inputs ni botones Guardar/X al operador

## MODIFIED Requirements

### Requirement: Aprobar Todo (en Base y CAO)
#### Scenario: Aprobar Todo con updateMany
- **WHEN** un admin hace clic en "Aprobar Todo"
- **THEN** los items extra (itemId=null) se aprueban individualmente con try/catch
- **AND** luego via updateMany se marcan todos los items con `aprobado: null` o `aprobado: false` como `true`
- **AND** la planilla pasa a estado `aprobado`

### Requirement: Visualización de Planilla Base
#### Scenario: RubrosManager condicional
- **WHEN** un usuario ve una Planilla Base en estado aprobado
- **THEN** el RubrosManager no se muestra arriba del grid
- **WHEN** la Base está en estado borrador o enviado
- **THEN** el RubrosManager se muestra normalmente

### Requirement: Eliminación de Planilla Base
La eliminación de una planilla está restringida por reglas de integridad.

#### Scenario: Bloquear eliminación de Base con CAOs
- **WHEN** un admin intenta eliminar una Planilla Base que tiene CAOs vinculados
- **THEN** se rechaza con error "No se puede eliminar la Planilla Base porque tiene CAOs vinculados"

#### Scenario: Bloquear eliminación fuera de borrador
- **WHEN** un admin intenta eliminar una planilla en estado enviado o aprobado
- **THEN** se rechaza con error "Solo se puede eliminar en estado borrador"

### Requirement: Eliminación de rubros e items en borrador
#### Scenario: Eliminar rubro en borrador
- **WHEN** un admin u operador intenta eliminar un rubro con AvanceItems en planillas en estado enviado o aprobado
- **THEN** se rechaza con error "No se puede eliminar el rubro porque tiene items vinculados a planillas"
- **AND** si solo tiene AvanceItems en planillas borrador, se eliminan esos AvanceItems, los items del rubro, y el rubro mismo

#### Scenario: Eliminar item en borrador
- **WHEN** un admin u operador intenta eliminar un item con AvanceItems en planillas en estado enviado o aprobado
- **THEN** se rechaza con error "No se puede eliminar el item porque está vinculado a planillas"
- **AND** si solo tiene AvanceItems en planillas borrador, se eliminan esos AvanceItems y el item

### Requirement: Limpieza de AvanceItems huérfanos
#### Scenario: Cleanup vía endpoint
- **WHEN** un admin ejecuta POST /api/planillas/cleanup-orphans
- **THEN** se eliminan todos los AvanceItems con itemId=null, rubroCodigo=null y descripcion=null
- **AND** retorna la cantidad de registros eliminados

### Requirement: Gran total en Base
#### Scenario: Fila TOTAL al final del grid
- **WHEN** un usuario ve la Planilla Base
- **THEN** al final del grid se muestra una fila "TOTAL" con la suma de Monto Original de todos los rubros
- **AND** las filas de subtotal por rubro fueron eliminadas

### Requirement: Columnas compactas en grillas
#### Scenario: Estado como símbolo
- **WHEN** un usuario ve cualquier grid de planilla
- **THEN** la columna Estado muestra ✓ (aprobado), ✗ (rechazado) o ○ (pendiente) en vez de texto
- **AND** el botón Guardar muestra 💾 en vez del texto "Guardar"

#### Scenario: Input sin spinners
- **WHEN** un usuario edita un campo numérico en cualquier grid
- **THEN** el input no muestra los botones de incremento/decremento nativos del navegador

#### Scenario: Columna Und angosta
- **WHEN** un usuario ve cualquier grid de planilla
- **THEN** la columna Und tiene ancho reducido (36px) para dar más espacio a columnas editables
