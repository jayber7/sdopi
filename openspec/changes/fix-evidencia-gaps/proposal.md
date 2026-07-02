## Why

El módulo de evidencia fotográfica tiene 4 gaps respecto a lo especificado: (1) falta botón "Restaurar" para fotos rechazadas, (2) supervisor puede subir fotos cuando no debería, (3) operador no puede eliminar sus propias fotos, (4) el approve forzado (`?force=true`) no tiene UI ni feedback.

## What Changes

- Agregar botón "Restaurar" en `PanelEvidencias.tsx` cuando una foto está `RECHAZADO` y el usuario es admin
- Quitar rol `supervisor` del guard del endpoint `POST /api/planillas/:planillaId/fotos/:avanceItemId`
- Agregar rol `operador` al guard de `DELETE /api/evidencias/:id` con verificación de ownership (operador solo elimina sus propias fotos)
- Agregar confirmación con opción "Forzar aprobación" en el frontend cuando el approve falla por evidencias faltantes

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `evidencia-fotografica`: Corrección de guards de roles, nuevo botón restaurar, force-approve con confirmación

## Impact

- `backend/src/evidencia/evidencia.controller.ts` — guards de roles
- `backend/src/evidencia/evidencia.service.ts` — verificación de ownership en delete
- `frontend/src/app/proyectos/[id]/PanelEvidencias.tsx` — botón restaurar, force-approve dialog
- `frontend/src/app/proyectos/[id]/page.tsx` — force-approve en botón Aprobar
