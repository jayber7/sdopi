## ADDED Requirements

### Requirement: Base de datos PostgreSQL en Neon
El sistema SHALL utilizar Neon como proveedor de base de datos PostgreSQL en producción.

#### Scenario: Conexión a Neon
- **GIVEN** una instancia Neon con PostgreSQL 16
- **WHEN** la aplicación backend se inicia en producción
- **THEN** Prisma se conecta a Neon usando `DATABASE_URL` con `?sslmode=require`
- **AND** la conexión es exitosa

#### Scenario: Migraciones aplicadas contra Neon
- **GIVEN** el schema de Prisma actualizado
- **WHEN** se ejecuta `npx prisma migrate deploy` apuntando a Neon
- **THEN** todas las migraciones pendientes se aplican
- **AND** la base de datos refleja el schema actual

### Requirement: Backend NestJS en Vercel (serverless)
El sistema SHALL desplegar el backend NestJS como función serverless en Vercel.

#### Scenario: Deploy a Vercel
- **GIVEN** el proyecto Vercel `sdopi-backend` vinculado al directorio `backend/`
- **WHEN** se hace push a `main` (o deploy manual)
- **THEN** Vercel ejecuta `npm run build && npx prisma generate` en `backend/`
- **AND** genera serverless functions desde `backend/src/main.ts:handler`
- **AND** el API está disponible en `https://sdopi-backend.vercel.app/api/*`

#### Scenario: Variables de entorno en Vercel
- **GIVEN** el proyecto Vercel `sdopi-backend`
- **WHEN** se configura el proyecto en Vercel dashboard
- **THEN** las siguientes variables de entorno están definidas:
  - `DATABASE_URL`: conexión a Neon con `?sslmode=require`
  - `JWT_SECRET`: secreto para firmar JWT
  - `CORS_ORIGIN`: URL del frontend desplegado
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: credenciales Cloudinary
  - `SKIP_EVIDENCE_CHECK` (opcional): `true` para deshabilitar verificación de evidencia

#### Scenario: CORS configurado para producción
- **GIVEN** el backend desplegado en Vercel
- **WHEN** el frontend hace requests desde su dominio de producción
- **THEN** el backend acepta requests con `Origin` igual a `CORS_ORIGIN`
- **AND** responde con headers CORS apropiados

### Requirement: Frontend Next.js en Vercel
El sistema SHALL desplegar el frontend Next.js en Vercel como proyecto separado.

#### Scenario: Nuevo proyecto Vercel para frontend
- **GIVEN** el repositorio con el frontend en `frontend/`
- **WHEN** se crea un nuevo proyecto Vercel apuntando a `frontend/`
- **THEN** Vercel detecta automáticamente Next.js
- **AND** ejecuta `npm run build` en `frontend/`
- **AND** el frontend está disponible en la URL asignada por Vercel

#### Scenario: Rewrites API en producción
- **GIVEN** el frontend desplegado en Vercel
- **WHEN** el frontend hace fetch a `/api/*`
- **THEN** Next.js rewrites redirigen a `https://sdopi-backend.vercel.app/api/*`
- **AND** las respuestas se devuelven al cliente sin exponer la URL del backend

### Requirement: Pipeline de deploy continuo
El sistema SHALL desplegar automáticamente en Vercel al hacer push a `main`.

#### Scenario: CI/CD con GitHub + Vercel
- **GIVEN** el repositorio conectado a Vercel para backend y frontend
- **WHEN** se hace push a la rama `main`
- **THEN** Vercel inicia automáticamente el deploy de los proyectos afectados
- **AND** los cambios están disponibles en producción tras el deploy exitoso

#### Scenario: Deploy manual desde CLI
- **GIVEN** Vercel CLI instalado y autenticado
- **WHEN** se ejecuta `vercel --prod` desde `backend/` o `frontend/`
- **THEN** el proyecto se despliega a producción

### Requirement: Documentación de despliegue
El sistema SHALL incluir documentación del proceso de despliegue y mantenimiento.

#### Scenario: README con instrucciones de deploy
- **GIVEN** el repositorio del proyecto
- **WHEN** un desarrollador necesita desplegar
- **THEN** existe documentación que cubre:
  - Creación y configuración de base de datos Neon
  - Configuración de proyectos Vercel (backend y frontend)
  - Variables de entorno requeridas
  - Aplicación de migraciones Prisma
  - Proceso de deploy (automático y manual)
  - Actualización de CORS cuando cambia la URL del frontend
