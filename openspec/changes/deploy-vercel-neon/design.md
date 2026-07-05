## Context

La aplicación se compone de backend NestJS (`backend/`) y frontend Next.js (`frontend/`) como workspaces de npm. El backend ya exporta un handler serverless para Vercel (`src/main.ts:handler`), tiene un `vercel.json` con build command, y un proyecto Vercel vinculado (`sdopi-backend`). El frontend nunca se ha desplegado. La base de datos usa Prisma con PostgreSQL (datasource ya configurado para postgresql), y el `.env.example` referencia Neon como provider.

## Goals / Non-Goals

**Goals:**
- Base de datos PostgreSQL en Neon accesible desde Vercel y desarrollo local
- Backend NestJS funcionando como serverless functions en Vercel
- Frontend Next.js desplegado en Vercel como proyecto separado
- Rewrites API funcionando en producción (frontend → backend)
- CORS configurado para permitir comunicación frontend-backend en producción
- Deploy automático via GitHub + Vercel para ambos proyectos
- Documentación del proceso

**Non-Goals:**
- Migrar de SQLite a PostgreSQL (ya está en PostgreSQL)
- Configurar dominio personalizado (se usa URL por defecto de Vercel)
- Configurar CI/CD fuera de Vercel (GitHub Actions no está en alcance)
- Cache o CDN (Vercel Edge Network maneja esto automáticamente)
- Monitoreo y alertas (se deja para fase posterior)

## Decisions

- **Neon como PostgreSQL serverless**: Neon ofrece PostgreSQL con branching, serverless, y tier gratuito generoso. El schema Prisma ya usa postgresql como datasource. Se usará `?sslmode=require` para conexión segura.
- **Backend y frontend como proyectos Vercel separados**: Aunque Vercel soporta monorepos, tener proyectos separados permite: (a) builds independientes, (b) variables de entorno separadas, (c) escalado independiente, (d) URLs de deploy separadas para debugging.
- **Proxy API via Next.js rewrites**: En lugar de CORS abierto, el frontend usa rewrites de Next.js para redirigir `/api/*` al backend. Esto evita exponer la URL del backend al cliente y simplifica CORS (solo el origen del frontend necesita estar permitido).
- **Prisma generate en build de Vercel**: El `vercel.json` del backend ejecuta `npx prisma generate` para compilar Prisma Client. No se necesita deploy de migraciones desde Vercel — las migraciones se aplican manualmente o via script CI aparte.
- **Migraciones aplicadas manualmente**: Prisma migrate necesita acceso directo a la DB. Se aplican desde local o desde un script CI con `DATABASE_URL` de producción. No se automatiza en el deploy de Vercel porque las serverless functions tienen timeout limitado.

## Risks / Trade-offs

- **Cold starts en serverless**: NestJS bootstrap pesado (~500ms-1s) en cada cold start. El handler ya implementa lazy initialization con singleton para mitigar. Aceptable para una app interna.
- **Timeout de Vercel serverless (10s en plan Hobby)**: Endpoints como reportes analíticos (PDF generation, queries pesadas) podrían exceder el límite. Mitigación: optimizar queries y mover PDF generation a streaming si es necesario.
- **Prisma Client size**: Prisma Client puede exceder el límite de 50MB de Vercel serverless. Mitigación: usar `@prisma/client` con `binaryTargets: ["native"]` en schema y generar solo el binario necesario.
- **Variables de entorno sensibles**: `DATABASE_URL`, `JWT_SECRET` deben manejarse con secrets de Vercel. No incluirlas en el repo.
- **CORS_ORIGIN cambia en cada deploy preview**: Cada PR genera una URL única. Mitigación: configurar CORS para aceptar múltiples orígenes o usar un wildcard controlado en previews.
