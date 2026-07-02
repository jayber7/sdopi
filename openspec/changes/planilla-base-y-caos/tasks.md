## 1. Schema

- [x] 1.1 Add `TipoPlanilla` enum and `tipo` + `planillaBaseId` to `PlanillaCAO` in Prisma schema
- [x] 1.2 Run migration

## 2. Backend

- [x] 2.1 Update `PlanillasService.create()` to bifurcate: BASE copies from Items, CAO copies from Base AvanceItems
- [x] 2.2 Add historical aggregation to `findOne()`: sum of approved previous CAOs per itemId
- [x] 2.3 Update DTO/interfaces for new fields
- [x] 2.4 Add validation: only one BASE per project, BASE must be approved before CAOs can reference it

## 3. Seed

- [x] 3.1 Create 1 Planilla Base aprobada
- [x] 3.2 Update CAOs 1-7 to reference the Base and set planillaBaseId

## 4. Frontend

- [x] 4.1 Redesign grid: columns for Contract, Previous, Present, Accumulated, % Period, % Cumulative
- [x] 4.2 Show "BASE" badge and simplified grid for Planilla Base view
- [x] 4.3 Handle extra items (no itemId) in CAO grid

## 5. Verify

- [x] 5.1 Run `npm run build` — both backend and frontend compile
- [x] 5.2 Reset + reseed database
