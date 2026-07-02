# Proyecto

## Purpose
Gestiona los datos contractuales de cada obra: nombre, contrato, montos, fechas, entidades responsables y jefatura. Los proyectos activos aparecen en la lista general; los desactivados se ocultan.

## Requirements

### Requirement: Creación de Proyecto
El sistema SHALL permitir a admin y operador crear proyectos con todos los datos contractuales.

#### Scenario: Crear proyecto exitosamente
- **WHEN** un admin u operador envía POST /api/proyectos con nombre, contratoNro, montoContrato, ordenProceder, fechaConclusion, secretaria, direccion, contratista, supervisor, fiscal
- **THEN** se crea el proyecto con `activo: true` y se devuelve el proyecto completo (incluyendo rubros)
- **AND** todos los campos opcionales (anticipoPct, suspendidoDias, jefatura) usan valores por defecto si no se especifican

#### Scenario: Validación de campos requeridos
- **WHEN** un admin u operador envía POST /api/proyectos con campos obligatorios faltantes
- **THEN** se rechaza con 400 Bad Request indicando el campo faltante

### Requirement: Listado de Proyectos
El sistema SHALL listar solo los proyectos activos, ordenados alfabéticamente por nombre.

#### Scenario: Listar proyectos activos
- **WHEN** un usuario autenticado envía GET /api/proyectos
- **THEN** se devuelve solo proyectos con `activo: true`
- **AND** cada proyecto incluye sus rubros con items (numero, descripcion, unidad, precioUnitario, cantidadContrato, montoOriginal)

### Requirement: Visualización de Detalle
El sistema SHALL mostrar todos los datos de un proyecto individual, incluyendo rubros, items con avances, y planillas.

#### Scenario: Ver detalle de proyecto
- **WHEN** un usuario autenticado envía GET /api/proyectos/:id
- **THEN** se devuelve el proyecto con rubros (ordenados por código ascendente), items (con avances incluidos), y planillas (ordenadas por número descendente)
- **AND** si el id no existe, se retorna 404 Not Found

### Requirement: Edición de Proyecto
El sistema SHALL permitir a admin y operador modificar cualquier campo de un proyecto activo.

#### Scenario: Editar proyecto
- **WHEN** un admin u operador envía PATCH /api/proyectos/:id con campos actualizados
- **THEN** el proyecto se actualiza y se devuelve el proyecto completo con rubros y planillas
- **AND** las fechas se convierten correctamente a DateTime

#### Scenario: Editar proyecto inexistente
- **WHEN** un admin u operador envía PATCH /api/proyectos/:id con un id que no existe
- **THEN** se retorna 404 Not Found

### Requirement: Desactivación de Proyecto (Soft Delete)
El sistema SHALL permitir desactivar proyectos mediante soft delete, marcando `activo: false` en lugar de eliminar registros.

#### Scenario: Desactivar proyecto
- **WHEN** un admin u operador envía DELETE /api/proyectos/:id
- **THEN** el proyecto se marca con `activo: false`
- **AND** el proyecto deja de aparecer en el listado general
- **AND** los datos del proyecto se conservan en la base de datos para referencia histórica

#### Scenario: Desactivar proyecto inexistente
- **WHEN** un admin u operador envía DELETE /api/proyectos/:id con un id que no existe
- **THEN** se retorna 404 Not Found

### Requirement: Interfaz de Lista
La interfaz SHALL mostrar la lista de proyectos activos con opciones de edición y desactivación según el rol.

#### Scenario: Ver lista de proyectos
- **WHEN** un usuario navega a /proyectos
- **THEN** se muestra el listado de proyectos activos con su nombre (link a detalle), contrato, monto, contratista y cantidad de rubros

#### Scenario: Crear desde la lista
- **WHEN** un admin u operador hace clic en "Nuevo Proyecto"
- **THEN** se abre un modal con todos los campos del proyecto
- **AND** al guardar exitosamente, la lista se refresca automáticamente

#### Scenario: Editar desde la lista
- **WHEN** un admin u operador hace clic en "Editar" en una tarjeta de proyecto
- **THEN** se abre el mismo modal con los datos del proyecto precargados
- **AND** al guardar, la lista se refresca

#### Scenario: Desactivar desde la lista
- **WHEN** un admin hace clic en "Desactivar" en una tarjeta de proyecto
- **THEN** se muestra confirmación antes de desactivar
- **AND** al confirmar, el proyecto se desactiva y la lista se refresca

### Requirement: Interfaz de Detalle
La interfaz SHALL mostrar el detalle del proyecto con botones de acción en la cabecera.

#### Scenario: Ver detalle del proyecto
- **WHEN** un usuario navega a /proyectos/:id
- **THEN** se muestra la cabecera con nombre, contrato, contratista, monto, supervisor y fiscal
- **AND** se muestran las pestañas General y Planillas

#### Scenario: Editar desde el detalle
- **WHEN** un admin u operador hace clic en "Editar proyecto" en la cabecera
- **THEN** se abre el modal de edición con los datos precargados
- **AND** al guardar, la vista se actualiza con los nuevos datos

#### Scenario: Desactivar desde el detalle
- **WHEN** un admin hace clic en "Desactivar proyecto" en la cabecera
- **THEN** se muestra confirmación
- **AND** al confirmar, se redirige a /proyectos

### Requirement: Control de Acceso por Rol
El sistema SHALL restringir las acciones de proyecto según el rol del usuario.

#### Scenario: Admin puede crear, editar y desactivar
- **WHEN** un admin intenta crear, editar o desactivar proyectos
- **THEN** todas las acciones son permitidas

#### Scenario: Operador puede crear y editar
- **WHEN** un operador intenta crear o editar proyectos
- **THEN** las acciones son permitidas
- **WHEN** un operador intenta desactivar proyectos
- **THEN** la acción es denegada (403)

#### Scenario: Consulta solo lectura
- **WHEN** un usuario con rol consulta navega a /proyectos
- **THEN** puede ver la lista y el detalle
- **WHEN** un usuario con rol consulta intenta crear, editar o desactivar
- **THEN** la acción es denegada (401 o 403)
