## 1. Backend: Corregir guards de roles

- [x] 1.1 Remover `'supervisor'` del decorador `@Roles()` en `POST /api/planillas/:planillaId/fotos/:avanceItemId` del controller
- [x] 1.2 Agregar `'operador'` al decorador `@Roles()` en `DELETE /api/evidencias/:id`
- [x] 1.3 Agregar verificación de ownership en `evidencia.service.ts`: si `user.role === 'operador'`, solo eliminar si `evidencia.userId === user.id`

## 2. Frontend: Botón Restaurar

- [x] 2.1 Importar `fetch` de API y agregar botón "Restaurar" en `PanelEvidencias.tsx` dentro del grid de fotos, visible solo cuando `foto.verificacionEstado === 'RECHAZADO'` y `user.role === 'admin'`
- [x] 2.2 Handler que hace `fetch(PATCH /api/evidencias/:id/restaurar)` con confirmación y refresca el panel

## 3. Frontend: Force-approve con confirmación

- [x] 3.1 En `page.tsx`, modificar el handler del botón "Aprobar" para capturar el error 400 con mensaje de evidencias pendientes
- [x] 3.2 Mostrar modal de confirmación "Hay items sin evidencia verificada. ¿Forzar aprobación?" con botón "Forzar"
- [x] 3.3 Si confirma, re-enviar con `?force=true`

## 4. Verificación

- [x] 4.1 Build de backend sin errores (`npx nest build`)
- [x] 4.2 Build de frontend sin errores (`npx next build`)
