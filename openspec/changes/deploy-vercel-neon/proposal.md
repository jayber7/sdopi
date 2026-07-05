## Why

La aplicación está actualmente en desarrollo local (localhost). Para ponerla a disposición del cliente se requiere desplegar el backend (NestJS API) en Vercel como serverless functions, la base de datos PostgreSQL en Neon, y el frontend (Next.js) en Vercel. El backend ya está parcialmente configurado para Vercel (export de handler serverless, vercel.json, proyecto Vercel vinculado), pero el frontend no.

## What Changes

- Configurar y aplicar migraciones de Prisma en Neon (base de datos PostgreSQL)
- Configurar variables de entorno en Vercel para backend (DATABASE_URL, JWT_SECRET, CLOUDINARY_*, CORS_ORIGIN)
- Vincular y desplegar frontend en Vercel (proyecto nuevo)
- Configurar CORS y rewrites para que frontend consuma backend en producción
- Documentar el proceso de despliegue y actualización

## Capabilities

### New Capabilities

- `deploy-infra`: Configuración de infraestructura de despliegue: Neon database, Vercel projects, variables de entorno, secrets, y pipelines de deploy

### Modified Capabilities

- *(ninguno — no cambian requirements de specs existentes)*

## Impact

- **Backend**: requiere `DATABASE_URL` apuntando a Neon, migraciones aplicadas, y env vars en Vercel dashboard
- **Frontend**: requiere nuevo proyecto Vercel, config CI/CD desde GitHub
- **Prisma**: datasource provider ya es `postgresql`; solo requiere migraciones aplicadas contra Neon
- **CI/CD**: push a main branch → deploy automático en Vercel para ambos proyectos
