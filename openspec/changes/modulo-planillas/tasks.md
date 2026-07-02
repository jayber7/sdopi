# Tasks: modulo-planillas

## 1. Backend — PlanillasController
- [x] 1.1 Crear PlanillasService con CRUD
- [x] 1.2 Crear PlanillasController con endpoints
- [x] 1.3 Crear PlanillasModule y registrar en AppModule
- [x] 1.4 Actualizar ProyectosService.findOne para incluir planillas
- [x] 1.5 Agregar AvanceItems al seed

## 2. Frontend — Detalle Proyecto
- [x] 2.1 Crear /proyectos/[id]/page.tsx
- [x] 2.2 Crear componente PlanillaGrid
- [x] 2.3 Crear modal crear/editar planilla
- [x] 2.4 Crear accion eliminar planilla
- [x] 2.5 npm run build sin errores

## 3. Fix aprobar/rechazar items en frontend
- [x] 3.1 Depurar visibilidad botones Ok/X en CAOGrid (admin + estado enviado)
- [x] 3.2 Reemplazar `window.location.reload()` con actualización reactiva de estado
- [x] 3.3 Al rechazar un item, la planilla vuelve a borrador (via botón "Devolver a Borrador")

## 4. Edición completa de AvanceItems
- [x] 4.1 Agregar inputs para descripcion, unidad, precioUnitario, cantidadContrato en items extra
- [x] 4.2 Mejorar `saveCant()` para enviar campos adicionales

## 5. Notificaciones de revisión
- [x] 5.1 Mostrar banner cuando items fueron rechazados (planilla en borrador/enviado)
- [x] 5.2 Mostrar banner cuando todos los items fueron aprobados

## 6. Edición de Planilla Base
- [x] 6.1 BaseGrid editable en estado borrador
- [x] 6.2 BaseGrid read-only cuando estado es aprobado

## 7. Approve/reject individual en BaseGrid
- [x] 7.1 Agregar columna Estado a BaseGrid
- [x] 7.2 Agregar botones Ok/X para admin (estado enviado)
- [x] 7.3 Agregar handleApprove/handleReject locales
- [x] 7.4 Row highlighting amarillo/rojo para items pendientes/rechazados

## 8. Rubros integrados en Base
- [x] 8.1 Eliminar pestaña Rubros del detalle de proyecto
- [x] 8.2 Mover RubrosManager dentro de la vista Planilla Base
- [x] 8.3 Agregar endpoint sync-from-items en backend
- [x] 8.4 Agregar botón "Refrescar Base" en cabecera de Base
- [x] 8.5 Auto-crear Planilla Base al cargar proyecto con rubros
- [x] 8.6 Items aprobados son read-only en estado borrador (no editables)
