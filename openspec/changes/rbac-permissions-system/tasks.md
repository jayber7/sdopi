## 1. Backend — Modelos y Migración

- [ ] 1.1 Agregar modelos `Role`, `Permission`, `RolePermission`, `UserPermission` a `schema.prisma`
- [ ] 1.2 Agregar campo `roleId` a `User` (relación a `Role`) manteniendo `role` string temporalmente
- [ ] 1.3 Ejecutar `prisma migrate dev` para crear las nuevas tablas
- [ ] 1.4 Crear `prisma/seed.ts` con roles por defecto (admin, operador, supervisor, consulta) y sus permisos
- [ ] 1.5 Ejecutar seed y verificar datos

## 2. Backend — Módulo RBAC

- [ ] 2.1 Crear `RbacModule` con `RbacService` y `RbacController`
- [ ] 2.2 Implementar CRUD de roles en `RbacService` (create, findAll, findOne, update, delete)
- [ ] 2.3 Implementar endpoints REST: `GET /roles`, `POST /roles`, `PATCH /roles/:id`, `DELETE /roles/:id`
- [ ] 2.4 Implementar `GET /permisos` que devuelva todos los pares resource:action disponibles
- [ ] 2.5 Implementar asignación de permisos a usuario: `POST /users/:id/permisos`, `DELETE /users/:id/permisos/:permissionId`, `GET /users/:id/permisos`
- [ ] 2.6 Implementar resolución de permisos efectivos (role-based + user overrides) en `RbacService.getEffectivePermissions(userId)`

## 3. Backend — Guards y Decoradores

- [ ] 3.1 Crear decorador `@RequirePermission(resource: string, action: string)` que setee metadata
- [ ] 3.2 Crear `PermissionGuard` que lea metadata y verifique contra `req.user.permissions`
- [ ] 3.3 Integrar permissions en JWT: modificar `JwtStrategy` para incluir `permissions[]` en el payload
- [ ] 3.4 Modificar `AuthService.login()` y `AuthService.me()` para resolver y devolver permisos efectivos
- [ ] 3.5 Crear endpoint `POST /auth/refresh-permissions` para refrescar sin re-login
- [ ] 3.6 Aplicar `@RequirePermission()` a controllers existentes (proyectos, planillas, evidencias, usuarios, catalogo, reportes)

## 4. Backend — Migración de datos existentes

- [ ] 4.1 Script de migración: mapear `User.role` string a `Role` relacional por nombre
- [ ] 4.2 Eliminar `RolesGuard` antiguo y su decorador `@Roles()`
- [ ] 4.3 Actualizar `create-user.dto.ts` para validar roleName contra roles existentes
- [ ] 4.4 Verificar que todos los endpoints existentes funcionan con el nuevo sistema de permisos

## 5. Frontend — Utilidad de permisos

- [ ] 5.1 Reactivar/reescribir `src/lib/permissions.ts` con función `can(user, resource, action)` y `PERMISSION_MATRIX` de defaults por rol
- [ ] 5.2 Extender `AuthContext` para cargar `permissions: string[]` en login y session restore
- [ ] 5.3 Exponer `can(resource, action)` desde `useAuth()` hook
- [ ] 5.4 Extender interfaz `User` en frontend con campo `permissions: string[]`

## 6. Frontend — Migrar verificaciones inline

- [ ] 6.1 Header.tsx: reemplazar `user.role === 'admin' || user.role === 'operador'` con `can('catalogo', 'read')` y `can('usuarios', 'read')`
- [ ] 6.2 usuarios/page.tsx: reemplazar guard `user.role !== 'admin'` con `!can('usuarios', 'read')`
- [ ] 6.3 proyectos/page.tsx: reemplazar `isAdmin`/`isOper` con `can('proyectos', 'create'|'update'|'delete')`
- [ ] 6.4 proyectos/[id]/page.tsx: reemplazar ~20 verificaciones inline con `can(resource, action)` (proyectos, planillas, evidencias según cada acción)
- [ ] 6.5 Verificar que no quedan `user?.role ===` sin migrar en el código

## 7. Frontend — Página /admin/roles

- [ ] 7.1 Crear página `src/app/admin/roles/page.tsx` con MUI Table de roles
- [ ] 7.2 Implementar Dialog para crear/editar rol con nombre, descripción y grilla de permisos
- [ ] 7.3 Implementar grilla resources×actions con checkboxes (usando MUI Table + Checkbox)
- [ ] 7.4 Implementar "Seleccionar/Deseleccionar todo" por fila de recurso
- [ ] 7.5 Implementar DELETE de rol con verificación de usuarios asignados

## 8. Frontend — Extender /usuarios con permisos

- [ ] 8.1 Agregar columna "Rol" (nombre del role) y botón "Permisos" en la tabla de usuarios
- [ ] 8.2 Implementar Dialog de permisos de usuario con:
  - Selector de rol (dropdown con roles existentes)
  - Grilla de permisos heredados (muted) vs overrides (highlight)
  - Checkboxes interactivos para agregar/quitar overrides
- [ ] 8.3 Guardar cambios vía `POST /users/:id/permisos` y refrescar visualmente

## 9. Frontend — Middleware RBAC

- [ ] 9.1 Definir mapeo `ruta → permiso requerido` en `middleware.ts`
- [ ] 9.2 Decodificar JWT en middleware para extraer permissions (usando `jose` o similar)
- [ ] 9.3 Redirigir a `/403` si falta permiso para la ruta
- [ ] 9.4 Crear página `/403` estática con mensaje y botón "Volver al inicio"
- [ ] 9.5 Probar flujo completo: login → permisos → navegación protegida

## 10. Verificación y limpieza

- [ ] 10.1 Ejecutar `npm run build` en backend y frontend
- [ ] 10.2 Probar CRUD completo de roles desde UI
- [ ] 10.3 Probar asignación de permisos a usuarios y verificación en guards
- [ ] 10.4 Probar migración de usuarios existentes
- [ ] 10.5 Probar que middleware redirige correctamente
