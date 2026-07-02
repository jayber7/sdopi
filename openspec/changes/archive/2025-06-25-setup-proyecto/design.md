# Design: setup-proyecto

## Technical Approach
Monorepo usando npm workspaces con dos subproyectos: `backend/` (NestJS) y `frontend/` (Next.js). Prisma ORM compartido desde el backend. SQLite como base de datos embebida para desarrollo.

## Architecture Decisions

### Decision: npm workspaces
Usar npm workspaces en lugar de Nx/Turborepo para minimizar dependencias iniciales.
- `backend/` - NestJS + Prisma
- `frontend/` - Next.js + Tailwind

### Decision: Prisma sobre TypeORM
Prisma ofrece mejor experiencia de desarrollo con autocompletado y migraciones simples.
SQLite como base de datos inicial por su simplicidad (sin servidor).

### Decision: Next.js App Router
App Router (app directory) es el estandar actual de Next.js. Layouts anidados, server components, etc.

## Directory Structure
```
cao-gestion/
├── package.json              # monorepo root
├── tsconfig.base.json        # shared TS config
├── .prettierrc
├── .eslintrc.cjs
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       └── ...
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       └── ...
└── README.md
```

## Data Flow
```
SQLite DB (.db file)
    ↕ Prisma ORM
  NestJS API (localhost:3001)
    ↕ HTTP REST
  Next.js Frontend (localhost:3000)
```

## Prisma Schema (initial)
```prisma
model Proyecto {
  id              Int      @id @default(autoincrement())
  nombre          String
  contratoNro     String
  municipio       String
  montoContrato   Float
  anticipoPct     Float    @default(13.7747448)
  ordenProceder   DateTime
  fechaConclusion DateTime
  suspendidoDias  Int      @default(0)
  direccion       String
  contratista     String
  supervisor      String
  fiscal          String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  planillas       PlanillaCAO[]
}

model Rubro {
  id          Int    @id @default(autoincrement())
  codigo      String // M01, M02, etc.
  nombre      String // Movimiento de Tierras, Pavimento, etc.
  proyectoId  Int
  proyecto    Proyecto @relation(fields: [proyectoId], references: [id])
  items       Item[]
}

model Item {
  id            Int     @id @default(autoincrement())
  numero        Int     // 1, 2, 3...
  descripcion   String
  unidad        String  // GLB, M3, ML, M2, KG, HA, PZA, DM3, KM
  precioUnitario Float
  cantidadContrato Float
  montoOriginal   Float
  rubroId       Int
  rubro         Rubro   @relation(fields: [rubroId], references: [id])
  avances       AvanceItem[]
}

model PlanillaCAO {
  id              Int      @id @default(autoincrement())
  numero          Int      // 1-10
  periodo         String   // "21-OCT-19 AL 31-ENE-20"
  fechaInicio     DateTime
  fechaFin        DateTime
  proyectoId      Int
  proyecto        Proyecto @relation(fields: [proyectoId], references: [id])
  avances         AvanceItem[]
}

model AvanceItem {
  id              Int     @id @default(autoincrement())
  cantidad        Float
  monto           Float
  avancePct       Float   // % de avance parcial
  itemId          Int
  item            Item    @relation(fields: [itemId], references: [id])
  planillaId      Int
  planilla        PlanillaCAO @relation(fields: [planillaId], references: [id])

  @@unique([itemId, planillaId])
}
```

## File Changes
- `package.json` (root, monorepo)
- `tsconfig.base.json`
- `.prettierrc`
- `.eslintrc.cjs`
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/nest-cli.json`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/next.config.ts`
- `frontend/tailwind.config.ts`
- `frontend/postcss.config.js`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/globals.css`
- `README.md`
