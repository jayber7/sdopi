# Design: modulo-aut

## Technical Approach
Autenticacion via JWT + httpOnly cookie. NestJS Passport con estrategia personalizada que extrae el token de la cookie `auth_token`. Frontend consume endpoint /auth/me al cargar para restaurar sesion. Roles implementados via guard + decorator.

## Architecture Decisions

### Decision: JWT en httpOnly cookie
- El token no es accesible desde JS (proteccion XSS)
- Se envia automaticamente en cada request (no hay que manejar headers)
- SameSite=Lax previene CSRF en la mayoria de casos
- Cookie firmada con secret de la app

### Decision: bcryptjs sobre bcrypt
- bcryptjs es JavaScript puro, no necesita compilacion nativa
- Misma API que bcrypt
- Suficiente para este caso de uso

### Decision: AuthContext con React Context
- Sin dependencias externas (no Redux, no Zustand solo para auth)
- Estado simple: user | null, loading boolean
- Provider envuelve el layout raiz

## Data Flow

### Login
```
Frontend                    Backend                   DB
   |                          |                        |
   |-- POST /auth/login ----->|                        |
   |   { email, password }    |-- SELECT * FROM user ->|
   |                          |<-- user ---------------|
   |                          | bcrypt.compare()       |
   |                          | jwt.sign({sub, role})  |
   |<-- Set-Cookie: auth_token|                        |
   |    (httpOnly, sameSite)  |                        |
```

### Session Restore
```
Frontend                    Backend
   |                          |
   |-- GET /auth/me --------->|
   |   Cookie: auth_token     |-- jwt.verify()
   |                          |-- SELECT user WHERE id
   |<-- { user } -------------|
   |   200 OK                 |
```

### Protected Route
```
Frontend                    Backend
   |                          |
   |-- GET /api/xxx --------->|
   |   Cookie: auth_token     |
   |                          |-- JwtAuthGuard.verify()
   |                          |-- RolesGuard.check(role)
   |                          |-- controller.handler()
   |<-- response -------------|
```

## File Changes

### Backend
- `backend/prisma/schema.prisma` (add User model)
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/auth/dto/create-user.dto.ts`
- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/auth/guards/jwt-auth.guard.ts`
- `backend/src/auth/guards/roles.guard.ts`
- `backend/src/auth/decorators/roles.decorator.ts`
- `backend/src/auth/decorators/current-user.decorator.ts`
- `backend/src/prisma/prisma.module.ts` (update exports)
- `backend/src/app.module.ts` (add imports)
- `backend/src/main.ts` (add cookie-parser)
- `backend/prisma/seed.ts` (add admin user)
- `backend/package.json` (add deps)

### Frontend
- `frontend/src/lib/auth-context.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/(dashboard)/layout.tsx`
- `frontend/src/app/usuarios/page.tsx`
- `frontend/src/app/layout.tsx` (add AuthProvider)
- `frontend/src/middleware.ts` (protect /usuarios)
