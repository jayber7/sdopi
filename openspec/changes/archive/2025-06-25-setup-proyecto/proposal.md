# Proposal: setup-proyecto

## Intent
Crear el scaffolding base del proyecto con NestJS (backend) y Next.js + React + Tailwind (frontend), incluyendo Prisma ORM con SQLite, estructura de monorepo, y configuracion de herramientas de desarrollo.

## Scope
In scope:
- Inicializar monorepo con npm workspaces (backend + frontend)
- Configurar NestJS con TypeScript estricto
- Configurar Next.js con App Router + Tailwind CSS
- Configurar Prisma ORM con SQLite
- Crear esquema inicial de base de datos (Proyecto, Rubro, Item, PlanillaCAO, AvanceItem)
- Configurar ESLint + Prettier para ambos proyectos
- Scripts de desarrollo (dev, build, lint)
- README basico del proyecto

Out of scope:
- Autenticacion y usuarios (proximo change)
- CRUD de entidades (proximo change)
- Dashboard y graficos (change futuro)
- Importacion de datos del Excel (change futuro)

## Approach
Monorepo con npm workspaces. Cada subproyecto en su propio directorio con su propio package.json, compartiendo configuraciones de ESLint/TypeScript donde tenga sentido. Prisma como capa unica de datos accesible desde NestJS.
