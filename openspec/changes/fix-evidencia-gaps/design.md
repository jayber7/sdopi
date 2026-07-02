## Context

El módulo de evidencia fotográfica está implementado con backend NestJS (controller, service, EXIF, geo-verification, Cloudinary) y frontend React (PanelEvidencias.tsx). La revisión identificó 4 gaps contra el spec:

1. No hay botón "Restaurar" para fotos RECHAZADO (backend endpoint existe)
2. Supervisor puede subir fotos (spec dice que no)
3. Operador no puede eliminar sus fotos (spec dice que sí)
4. Approve forzado sin UI (backend acepta `?force=true`, frontend no lo envía)

## Goals / Non-Goals

**Goals:**
- Corregir los 4 gaps cumpliendo el spec original
- Mínimo cambio necesario, tocar solo lo que está mal

**Non-Goals:**
- No rediseñar UI de evidencias
- No cambiar el modelo de datos
- No agregar nuevas funcionalidades

## Decisions

- **Restaurar con endpoint existente**: Usar el `PATCH /api/evidencias/:id/restaurar` que ya existe. En frontend, mostrar botón solo cuando `user.role === 'admin'` y foto está `RECHAZADO`.
- **Delete con ownership check**: En lugar de pasar `userId` en query param (inseguro), el service usará `req.user.id` del JWT para verificar ownership. Operador solo elimina si `foto.userId === req.user.id`. Admin/supervisor eliminan cualquier foto.
- **Force-approve con confirm dialog**: Al fallar aprobación con 400 + mensaje de evidencias pendientes, mostrar modal de confirmación: "Hay items sin evidencia verificada. ¿Forzar aprobación?" con botón "Forzar" que llama `/aprobar?force=true`.
- **Supervisor removido del POST guard**: Simple cambio en decorador `@Roles()` en el controller.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|-----------|
| Ownership check en delete puede fallar si JWT no tiene userId | El middleware de auth ya expone `req.user` con id, es confiable |
| Force-approve sin advertencia podría aprobar planillas incompletas | El confirm dialog deja claro el riesgo; solo admin puede forzar |
