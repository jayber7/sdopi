# Evidencia Fotográfica — Delta

## Purpose

Correcciones a guards de roles, ownership en delete, botón restaurar, y force-approve.

---

## Modified Requirements

### Requirement: Upload de Foto con Verificación

#### Scenario: Subir foto — roles corregidos
- GIVEN una planilla en estado `borrador`
- WHEN un **admin** u **operador** envía `POST /api/planillas/:planillaId/fotos/:avanceItemId`
- THEN se procesa normalmente
- WHEN un **supervisor** envía la misma request
- THEN 403 Forbidden

### Requirement: Eliminar evidencia

#### Scenario: Eliminar evidencia (roles corregidos)
- GIVEN una evidencia existente
- WHEN `DELETE /api/evidencias/:id` por `admin` o **supervisor**
- THEN se elimina la imagen de Cloudinary y el registro de la BD
- WHEN `DELETE /api/evidencias/:id` por **operador** y `evidencia.userId === req.user.id`
- THEN se elimina la imagen y el registro
- WHEN `DELETE /api/evidencias/:id` por **operador** y `evidencia.userId !== req.user.id`
- THEN 403 Forbidden

### Requirement: Restaurar evidencia (UI)

#### Scenario: Restaurar desde frontend
- GIVEN una evidencia en estado `RECHAZADO`
- WHEN un **admin** está viendo el Panel de Evidencias
- THEN se muestra botón "Restaurar" en la tarjeta de la foto rechazada
- WHEN el admin hace click en "Restaurar"
- THEN confirma con `confirm("¿Restaurar esta evidencia?")`
- AND envía `PATCH /api/evidencias/:id/restaurar`
- AND la foto vuelve al estado `VERIFICADO` o `SOSPECHOSO` según sus coordenadas
- AND el botón "Restaurar" desaparece

### Requirement: Validación en aprobación (force-approve UI)

#### Scenario: Force-approve con confirmación
- GIVEN una planilla en estado `borrador`
- WHEN un **admin** hace click en "Aprobar" y hay items sin evidencia verificada
- THEN el backend devuelve 400 con mensaje "Items pendientes: N°1, N°3"
- AND el frontend muestra modal de confirmación: "Hay items sin evidencia verificada. ¿Forzar aprobación?"
- AND el admin puede hacer clic en "Forzar aprobación"
- THEN se envía `PATCH /api/planillas/:id/aprobar?force=true`
- AND la planilla se aprueba
- WHEN el admin cancela el confirm dialog
- THEN no se aprueba la planilla

---

## Security & Access (Actualizado)

| Acción | admin | supervisor | operador | consulta |
|--------|-------|------------|----------|----------|
| Subir foto (borrador) | ✓ | ~~✗~~ **✗** | ✓ | ✗ |
| Eliminar propia foto | ✓ | ~~✗~~ **✗** | ~~✓~~ **✓** | ✗ |
| Restaurar foto | ✓ | ✗ | ✗ | ✗ |
| Forzar aprobación (UI) | ✓ | ✗ | ✗ | ✗ |

## API Reference (Actualizado)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/planillas/:planillaId/fotos/:avanceItemId` | admin, ~~supervisor~~ **operador** | Subir foto |
| `DELETE` | `/api/evidencias/:id` | admin, supervisor, **operador (own)** | Eliminar evidencia |
