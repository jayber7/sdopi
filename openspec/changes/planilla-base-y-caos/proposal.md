## Why

Actualmente los CAOs se crean copiando todos los Items del proyecto, sin una referencia base fija. Se necesita una **Planilla Base** por proyecto que contenga los datos "Según Contrato" (precioUnitario, cantidadContrato, montoOriginal) y que, una vez aprobada, sirva como referencia inmutable para todos los CAOs posteriores. Cada CAO debe heredar los items de la Base y mostrar datos acumulativos de avance anterior, presente y a la fecha.

## What Changes

- Agregar `tipo` (`BASE | CAO`) y `planillaBaseId` (self-reference) a `PlanillaCAO`
- Nueva lógica de creación: si es `BASE`, copia desde Items del proyecto; si es `CAO`, copia desde la PlanillaBase vinculada
- Nuevo endpoint de agregación histórica: para un CAO dado, retornar avance anterior (suma de CAOs previos aprobados)
- Seed: crear 1 PlanillaBase (aprobada) + 7 CAOs vinculados con cantidades distribuidas
- Frontend: grid con columnas de Según Contrato, Avance Anterior, Avance Presente, Avance Acumulado, % Periodo, % a la Fecha
- El grid de CAO ya no itera sobre Items del proyecto, sino sobre AvanceItems de la PlanillaBase

## Capabilities

### New Capabilities
- `planilla-base`: Creación y gestión de la Planilla Base por proyecto, con workflow borrador → enviado → aprobado. Datos "Según Contrato" inmutables una vez aprobada.
- `cao-acumulativo`: Visualización de CAOs con datos acumulativos (avance anterior, presente, acumulado, porcentajes) derivados de la Planilla Base.
- `cao-extra-items`: Capacidad de agregar items adicionales en un CAO que no existen en la Planilla Base (items extra del período).

### Modified Capabilities
- *(ninguna)*

## Impact

**Schema**: Migración Prisma — nuevo enum `TipoPlanilla`, columna `tipo` en `PlanillaCAO` con default `'CAO'`, columna `planillaBaseId` nullable auto-referenciada.

**Backend** (`planillas.service.ts`):
- `create()`: bifurca según tipo. BASE → copia de Items. CAO → copia de AvanceItems de la Base.
- Nuevo helper/resource para retornar datos acumulados históricos.

**Seed** (`prisma/seed.ts`): crear 1 PlanillaBase + ajustar CAOs existentes para que referencien la Base.

**Frontend** (`proyectos/[id]/page.tsx`): grid rediseñado con columnas de datos contractuales y acumulativos.
