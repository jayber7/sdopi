## Why

El sistema actual tiene un control de acceso basado únicamente en roles fijos (admin, operador, supervisor, consulta) con verificaciones inline dispersas en 5+ archivos frontend y sin ningún control en backend. No existe un sistema de permisos granulares, el archivo `lib/permissions.js` está muerto (nunca se importa), y no hay forma de asignar permisos específicos a usuarios individuales. Esto impide que un administrador pueda, por ejemplo, dar acceso de solo lectura a un usuario sobre proyectos pero permiso de edición sobre evidencias. Se necesita un sistema completo de Roles, Permisos y Privilegios (RBAC) configurable desde la UI.

## What Changes

- **Nuevo backend**: Módulo completo de RBAC con modelos Prisma para Roles, Permisos, y Privilegios por usuario
- **Nuevo API REST**: Endpoints CRUD para roles, permisos, asignación de roles/permisos a usuarios
- **Nueva página de administración UI**: Gestión visual de roles y permisos con tabla de asignación usuario-rol-permiso
- **Reemplazar verificaciones inline**: Sustituir todos los `user?.role === 'admin'` esparcidos por un utility centralizado `can(user, resource, action)`
- **Middleware con autorización**: Middleware de Next.js que verifique no solo autenticación sino también permisos mínimos por ruta
- **Backend guards**: Decoradores/guards en NestJS para proteger endpoints por permiso
- **Migración de datos**: Script para migrar roles existentes al nuevo sistema
- **Permisos por usuario (override)**: Capacidad de asignar permisos específicos a un usuario por encima de los de su rol

## Capabilities

### New Capabilities
- `rbac-permissions`: Sistema de roles, permisos y privilegios con asignación a usuarios
- `permisos-admin-ui`: Interfaz de administración para gestionar roles y permisos por usuario
- `auth-backend-guards`: Protección de endpoints NestJS mediante decoradores de permisos
- `auth-middleware-rbac`: Middleware de Next.js con verificación de permisos por ruta

### Modified Capabilities
- `auth`: El sistema actual de autenticación se extiende con el modelo de permisos; el AuthContext expondrá una función `can()` y los datos de permisos del usuario
- `usuarios`: La administración de usuarios existente se extiende con asignación de roles y permisos granulares

## Impact

- **Backend**: Nuevos modelos Prisma (`Role`, `Permission`, `UserPermission`), nuevos módulos NestJS, nuevos endpoints API
- **Frontend**: Nueva carpeta `src/app/admin/permisos/`, modificaciones en `AuthContext`, `lib/permissions.js` se reactiva/reescribe, todas las páginas con verificaciones de rol se actualizan para usar `can()`
- **Base de datos**: Nuevas tablas + migración de datos existentes
- **Rutas**: Nuevas rutas protegidas por permiso, no solo por rol
