# Proyecto

## Purpose
Gestiona los datos contractuales de cada obra: nombre, contrato, montos, fechas, entidades responsables, jefatura y situación/etapa. Los proyectos activos aparecen en la lista general; los desactivados se ocultan.

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
- **THEN** se devuelve solo proyectos con `activo: true`, ordenados por última modificación descendente (`updatedAt DESC`)
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
- **AND** los campos numéricos (suspendidoDias, montoContrato, anticipoPct, latitud, longitud) usan `|| ''` en el frontend para evitar el warning de React controlled input al escribir 0 o borrar el valor
- **AND** los inputs tipo number que permiten backspace usan `<input type="text" inputMode="decimal">` para no bloquear la escritura de 0 o valores vacíos temporales

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
- **AND** se muestran las pestañas General, Planillas y Dashboard

#### Scenario: Editar desde el detalle
- **WHEN** un admin u operador hace clic en "Editar proyecto" en la cabecera
- **THEN** se abre el modal de edición con los datos precargados
- **AND** al guardar, la vista se actualiza con los nuevos datos

#### Scenario: Desactivar desde el detalle
- **WHEN** un admin hace clic en "Desactivar proyecto" en la cabecera
- **THEN** se muestra confirmación
- **AND** al confirmar, se redirige a /proyectos

### Requirement: Selección de ubicación con provincia, municipio y mapa interactivo
El formulario de proyecto SHALL permitir seleccionar ubicación eligiendo provincia y municipio, y luego ajustando coordenadas en un mapa Leaflet.

#### Scenario: Seleccionar provincia y municipio
- **WHEN** el usuario selecciona una provincia
- **THEN** el select de municipios se filtra por esa provincia
- **AND** se limpian latitud, longitud y dirección
- **WHEN** el usuario selecciona un municipio
- **THEN** el mapa se centra en las coordenadas del municipio con un marcador
- **AND** los inputs lat/lng se actualizan
- **AND** se consulta Nominatim para rellenar la dirección automáticamente

#### Scenario: Ajustar coordenadas en el mapa
- **WHEN** el usuario hace clic o arrastra el marcador en el mapa
- **THEN** los inputs lat/lng se actualizan
- **AND** se ejecuta reverse geocoding para actualizar la dirección

#### Scenario: Búsqueda de lugares en el mapa
- **WHEN** el usuario busca un lugar en el campo de búsqueda del mapa
- **THEN** se muestran resultados de Nominatim
- **AND** al seleccionar un resultado, el mapa se centra allí

### Requirement: Situación actual del proyecto (EtapaProyecto)
El sistema SHALL incluir un campo `situacion` de tipo `EtapaProyecto` (enum) que indica la etapa del ciclo de vida del proyecto. NO tiene restricciones de transición — el usuario puede cambiarlo a cualquier valor en cualquier momento.

El enum `EtapaProyecto` soporta 14 valores: `SIN_EJECUCION`, `PREINVERSION`, `INVERSION`, `CAMBIO_PREINVERSION_A_INVERSION`, `INVERSION_PARA_LICITACION`, `EDTP_CONCLUIDO`, `EDTP_CONCLUIDO_ESPERA_INVERSION`, `EN_EJECUCION`, `EN_CIERRE`, `CONCLUIDO`, `CON_ENTREGA_DEFINITIVA`, `CONCILIACION_SALDOS`, `AUDITORIA_EXTERNA`, `SUSPENSION_CONTRATACION`.

#### Scenario: Crear proyecto sin situación
- **WHEN** se crea un proyecto nuevo
- **THEN** el campo `situacion` es opcional, default vacío
- **AND** el dropdown muestra "Sin especificar" como valor por defecto

#### Scenario: Editar situación del proyecto
- **WHEN** un admin u operador edita un proyecto
- **THEN** el formulario incluye un Select con los 14 valores del enum
- **AND** permite cambiar a cualquier valor sin restricciones de secuencia
- **AND** el detalle del proyecto muestra la situación actual en la cabecera

### Requirement: Dashboard de Proyecto
La pestaña Dashboard SHALL mostrar indicadores clave de avance del proyecto con KPI cards y gráficos de dona (PieChart de recharts).

#### Scenario: KPIs del Dashboard
- **WHEN** un usuario navega a la pestaña Dashboard de un proyecto
- **THEN** se muestran los siguientes KPIs: Avance Físico (%), Avance Financiero (Bs ejecutado), Saldo por Ejecutar (Bs), Tiempo (%), Items con avance (N/total), y % Anticipo
- **AND** el color del Avance Físico varía: verde (>80%), naranja (40-80%), rojo (<40%)

#### Scenario: Gráfico Avance Físico
- **WHEN** se muestra el dashboard
- **THEN** se renderiza un PieChart tipo dona con el avance físico: porción azul = `sum(avances.monto)/sum(items.montoOriginal)*100`, porción gris = pendiente
- **AND** el centro muestra el porcentaje de avance físico

#### Scenario: Gráfico Avance Financiero
- **WHEN** se muestra el dashboard
- **THEN** se renderiza un PieChart tipo dona con el avance financiero: porción verde = `anticipoMonto + sum(avances.monto)*(1-anticipoPct/100)`, porción gris = saldo restante
- **AND** el centro muestra el porcentaje de avance financiero
- **AND** el avance financiero difiere del físico porque incluye el anticipo como base y descuenta proporcionalmente el % de anticipo de cada desembolso (líquido pagado)

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
