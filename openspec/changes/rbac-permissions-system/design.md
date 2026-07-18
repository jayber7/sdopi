## Context

Estado actual:
- `User.role` es un string plano (`admin`, `operador`, `supervisor`, `consulta`)
- No existen modelos `Role` ni `Permission` en Prisma
- Solo existe `RolesGuard` que verifica `user.role === @Roles()` (string match)
- `lib/permissions.js` en frontend está muerto (nunca se importa)
- 30+ verificaciones inline de `user?.role === 'admin'` esparcidas en 5 archivos

Stack: NestJS + Prisma (SQLite) + Next.js 15 + MUI v7 + Tailwind v4

## Goals / Non-Goals

**Goals:**
- Sistema completo de roles, permisos y privilegios granulares
- Roles configurables desde la UI (crear/editar roles dinámicamente)
- Asignación de permisos por usuario (role-based + user-specific overrides)
- Backend protegido con decorador `@RequirePermission(resource, action)`
- Frontend reemplaza todos los `user.role === 'x'` con `can(resource, action)`
- UI de administración para gestionar todo el sistema de permisos
- Middleware de Next.js que verifique permisos mínimos por ruta

**Non-Goals:**
- No se implementa SSO/OAuth (mantenemos login email+password)
- No se implementa auditoría de cambios de permisos (logs simples bastan)
- No se implementa multi-tenant (todos los usuarios comparten el mismo espacio)

## Decisions

### Decision 1: Prisma Models
```
Role { id, name, description, createdAt, updatedAt }
Permission { id, resource, action, createdAt }
RolePermission { roleId, permissionId }  // M:N
UserPermission { userId, permissionId, granted }  // M:N, granted=true/false para overrides
User.roleId → Role.id  // en vez de User.role string
```

**Rationale**: Modelo relational estándar RBAC. `granted=false` permite restricciones explícitas (denegar un permiso específico a un usuario aunque su rol lo incluya).

**Alternativa considerada**: JSON field con permisos en User. Descartado porque no permite query eficiente de "qué usuarios tienen permiso X".

### Decision 2: Permission strings como `resource:action`
```
proyectos:read, proyectos:create, proyectos:update, proyectos:delete
planillas:read, planillas:create, planillas:update, planillas:delete, planillas:aprobar, planillas:enviar
evidencias:read, evidencias:create, evidencias:update, evidencias:delete, evidencias:verificar
reportes:read, reportes:export
usuarios:read, usuarios:create, usuarios:update, usuarios:delete
catalogo:read, catalogo:create, catalogo:update, catalogo:delete
roles:read, roles:create, roles:update, roles:delete
permisos:read, permisos:assign
```

**Rationale**: Formato legible y fácil de serializar en JWT. Compatible con CASL (opcional para futuro).

### Decision 3: Permisos en JWT payload
El JWT incluirá `permissions: string[]` con los permisos efectivos resueltos al momento de login. Los guards leen del JWT sin query a DB.

**Rationale**: Performance — evita query a DB en cada request. Trade-off: si un admin cambia permisos, el usuario no los ve hasta que re-logee o se refresque el token (TTL 24h).

**Mitigación**: Endpoint `POST /auth/refresh-permissions` que el frontend puede llamar después de cambios en la UI de administración.

### Decision 4: `@RequirePermission()` decorator + guard
```typescript
@RequirePermission('planillas', 'create')
@Post()
async create(@Body() dto: CreatePlanillaDto) { ... }
```

Implementado como decorador que setea metadata + guard que la lee y compara con `req.user.permissions`.

**Alternativa considerada**: Usar CASL (JavaScript library). Descartado por simplicidad — el sistema de permisos es lo suficientemente simple (boolean checks) como para no necesitar una librería de evaluación de políticas.

### Decision 5: Frontend `can()` utility
```typescript
// lib/permissions.ts
export function can(user: User | null, resource: string, action: string): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes(`${resource}:${action}`);
}
```

**Archivos a migrar**: Header.tsx (3 checks), usuarios/page.tsx (3 checks), proyectos/page.tsx (3 checks), proyectos/[id]/page.tsx (~20 checks). Cada `user?.role === 'admin'` se reemplaza con `can(user, 'x', 'y')`.

### Decision 6: Route-permission mapping en middleware
```typescript
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin': 'roles:read',  // cualquier ruta /admin/* requiere al menos un permiso de admin
  '/usuarios': 'usuarios:read',
};
```

Las rutas se verifican en el middleware de Next.js decodificando el JWT. Si falta permiso → redirect a `/403`.

### Decision 7: UI de administración de permisos
Página `/admin/roles` con:
- Lista de roles (CRUD)
- Al editar rol: grilla resources×actions con checkboxes
- En `/usuarios`: botón "Permisos" por usuario que abre dialog con:
  - Selector de rol (dropdown)
  - Grilla de permisos (heredados en muted, overrides en highlight)

Usa los mismos componentes MUI (Dialog, Table, Checkbox, Chip) del resto del sistema.

### Decision 8: Seed de roles por defecto
En `PrismaModule.onModuleInit()`, verificar si existen roles. Si no, crear:
- **admin**: todos los permisos
- **operador**: proyectos CRUD, planillas CRUD+enviar, evidencias CRUD, reportes read
- **supervisor**: proyectos read, planillas read+aprobar, evidencias read+verificar, reportes read
- **consulta**: proyectos read, reportes read

Migración: los `User.role` strings existentes se mapean al rol correspondiente por nombre.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Permisos en JWT pueden quedar desactualizados si admin cambia permisos y usuario no re-loguea | Endpoint `POST /auth/refresh-permissions` + botón "Refrescar permisos" en UI |
| Migración de datos existentes: usuarios con roles string a modelo relacional | Script de migración en `prisma/seed.ts` + verify post-migration |
| Complejidad en la UI de permisos (grilla 8×8 puede ser confusa) | Tooltips en cada checkbox + secciones colapsables por recurso + "Seleccionar/Deseleccionar todo" por fila |
| Rendimiento: middleware de Next.js decodificando JWT en cada request | JWT es stateless, decodificar es O(1) y no requiere fetch externo |

## Migration Plan

1. Crear modelos Prisma + migración
2. Seed de roles por defecto en `prisma/seed.ts`
3. Script de migración: `UPDATE User SET roleId = (SELECT id FROM Role WHERE name = User.role)` 
4. Backend: nuevo `RbacModule`, `@RequirePermission()`, guard, endpoints CRUD
5. Frontend: `lib/permissions.ts` con `can()`, migrar verificaciones inline
6. Frontend: página `/admin/roles` con CRUD de roles
7. Frontend: extender `/usuarios` con asignación de permisos por usuario
8. Middleware: mapeo ruta→permiso + verificación JWT
9. AuthContext: cargar permisos en login + exponer `can()`

## Open Questions

- ¿Los permisos negativos (granted=false) se incluyen o se manejan como denegación explícita? → Se manejan como denegación: si un rol da `planillas:create` pero el usuario tiene `UserPermission` con `granted=false`, se deniega.
- ¿Refresh de token automático o manual? → Manual por ahora (botón en UI). Automático si es necesario más adelante.
