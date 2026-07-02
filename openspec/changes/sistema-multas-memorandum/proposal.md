## Why

Los CAOs tienen un periodo definido (fechaInicio — fechaFin). Cuando no se aprueban dentro de ese plazo no hay un mecanismo que registre los días de retraso ni calcule penalidades. Se necesita un sistema que monitoree automáticamente los plazos, contabilice días de retraso, calcule multas (8.000 Bs/día por proyecto), y genere memoranda PDF como respaldo documental.

## What Changes

- Nuevo modelo `Multa` en Prisma para persistir periodos de retraso por CAO
- Campo `multaDiaria` en `Proyecto` para configurar monto por día (default 8.000)
- Cálculo automático de días de retraso para CAOs en estado `borrador` o `enviado` cuya `fechaFin` ya pasó
- Generación de PDF Memorandum con detalle de la multa
- Alertas en UI: vista general de proyectos con retrasos, vista detalle de CAO con días y montos acumulados
- Endpoints API para listar multas, generar memorandum PDF, y consultar estado de retrasos
- La aprobación del CAO no queda bloqueada por la multa (se aprueba con deuda pendiente)

## Capabilities

### New Capabilities

- `multa-tracking`: Cálculo y persistencia de días de retraso por CAO, incluyendo detección automática al consultar planillas
- `memorandum-pdf`: Generación de PDF con código único de memorandum, detalle de días, monto diario, y monto total
- `alerts-dashboard`: Vista general de proyectos con retrasos activos, días contabilizados, y montos acumulados
- `multa-admin`: Endpoints CRUD para multas y acciones de administración (generar memorandum, pagar/anular)

### Modified Capabilities

- *(ninguna — no se modifican specs existentes)*

## Impact

- **Backend**: Nuevo modelo `Multa` en Prisma, nuevo endpoint `PATCH /proyectos/:id` para actualizar `multaDiaria`, nuevos endpoints `/multas/*` y `/memorandum/*`
- **Frontend**: Nuevos componentes de alerta en vista de proyecto y detalle de CAO, botón "Generar Memorandum PDF"
- **BD**: Nueva tabla `Multa`, nueva columna `multaDiaria` en `Proyecto`
- **Dependencias nuevas**: Librería para generación de PDF (pdfkit o similar)
