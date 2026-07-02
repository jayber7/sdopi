# Proposal: modulo-aut

## Intent
Agregar autenticacion y autorizacion al sistema CAO Gestion. Los usuarios deben poder iniciar sesion con email y password, obtener un JWT via httpOnly cookie, y acceder a recursos segun su rol (admin, operador, consulta).

## Scope
In scope:
- Modelo User en Prisma con roles
- Login con JWT + httpOnly cookie
- Logout (limpiar cookie)
- Endpoint /auth/me para verificar sesion
- Creacion de usuarios por admin
- CRUD de usuarios (solo admin)
- Guard para proteger rutas NestJS
- Decorador @Roles para control de acceso
- Frontend: pagina de login
- Frontend: AuthContext con estado global
- Frontend: layout protegido (redirect si no auth)
- Frontend: pagina de gestion de usuarios (admin)
- Seed con usuario admin por defecto

Out of scope:
- Recuperacion de contrasena (proximo cambio)
- 2FA / MFA
- OAuth social (Google, etc.)
- Refresh token rotation

## Approach
JWT almacenado en httpOnly cookie (secure en prod, sameSite=lax). NestJS Passport con estrategia JWT que lee de cookie. Frontend usa AuthContext con React Context + hook useAuth. Roles: admin (todo), operador (gestion de planillas), consulta (solo lectura).
