# Tasks: modulo-aut

## 1. Backend — Modelo y Servicios
- [x] 1.1 Agregar modelo User a schema.prisma
- [x] 1.2 Instalar dependencias: bcryptjs, @nestjs/jwt, @nestjs/passport, passport, passport-jwt, cookie-parser, @types/bcryptjs, @types/passport-jwt, @types/cookie-parser, @types/express
- [x] 1.3 Crear UsersModule, UsersService (CRUD basico)
- [x] 1.4 Crear AuthModule, AuthService (login, register, validate)
- [x] 1.5 Configurar cookie-parser en main.ts
- [x] 1.6 Actualizar seed con usuario admin por defecto
- [x] 1.7 Ejecutar db:push y db:seed

## 2. Backend — JWT y Guards
- [x] 2.1 Configurar JwtModule con secret y expiracion de 24h
- [x] 2.2 Crear JwtStrategy (extraer token de cookie 'auth_token')
- [x] 2.3 Crear JwtAuthGuard
- [x] 2.4 Crear RolesGuard + decorador @Roles
- [x] 2.5 Crear decorador @CurrentUser

## 3. Backend — Controladores
- [x] 3.1 AuthController: POST /auth/login, POST /auth/logout, GET /auth/me
- [x] 3.2 AuthController: POST /auth/register (solo admin)
- [x] 3.3 UsersController: GET/PATCH/DELETE /users (solo admin)
- [x] 3.4 Actualizar AppModule y PrismaModule

## 4. Frontend — Auth
- [ ] 4.1 Crear endpoint helper en src/lib/api.ts
- [x] 4.2 Crear AuthContext con AuthProvider y useAuth hook
- [x] 4.3 Envolver layout con AuthProvider
- [x] 4.4 Crear pagina /login con formulario
- [x] 4.5 Crear middleware.ts para redireccion a login

## 5. Frontend — Gestion de Usuarios (Admin)
- [x] 5.1 Crear pagina /usuarios con tabla de usuarios
- [x] 5.2 Proteger ruta solo para admin

## 6. Integracion
- [x] 6.1 npm run build sin errores
