## Why

Actualmente el sistema solo gestiona planillas CAO y evidencias fotográficas, pero no genera el informe comparativo que la Secretaría de Obras Públicas necesita para el seguimiento físico-financiero de proyectos viales. Este reporte se elabora manualmente en Excel replicando la estructura del archivo `Docs/ANALISIS DE CAO ROSARIO DEL INGRE V4.xlsm`. Digitalizarlo ahorra tiempo, elimina errores de carga manual y centraliza la información.

## What Changes

- Nuevo endpoint backend que genera el reporte de Análisis Comparativo de CAOs para un proyecto: tabla financiera por CAO (N°1 al N°10), desglose de montos contractuales, deducciones, avance físico/financiero acumulado, y saldos.
- Nuevo endpoint backend que genera el reporte detallado de Planillas de Avance de Obra: desglose ítem por ítem con cantidades ejecutadas por período y avance porcentual.
- Nuevos modelos Prisma para datos financieros complementarios: multas, desembolsos programados.
- Nueva página en el frontend para visualizar, imprimir y exportar el reporte.
- Extensión del modelo Proyecto con campos faltantes (monto anticipo, % anticipo).

## Capabilities

### New Capabilities
- `reporte-analisis-cao`: Generar el informe comparativo de CAOs con tabla financiera consolidada, desglose contractual, avance físico/financiero y saldos.
- `reporte-planilla-detalle`: Generar el detalle ítem por ítem de cada planilla CAO con cantidades ejecutadas, montos y avance porcentual acumulado por período.
- `datos-complementarios`: CRUD para multas, desembolsos programados y otros datos financieros necesarios para el reporte que no están en PlanillaCAO ni AvanceItem.

### Modified Capabilities
- *(ninguna — cambio puramente aditivo)*

## Impact

- **Backend**: Nuevo módulo `reportes/` con controlador, servicio, DTOs. Nuevos modelos Prisma (`DesembolsoProgramado`, `Multa`). Extensión de modelo `Proyecto`.
- **Frontend**: Nueva ruta `/reportes/analisis-cao/:proyectoId`. Componentes de tabla financiera, tabla de detalle por ítems, y curva de avance físico vs financiero.
- **API**: Nuevos endpoints REST bajo `/api/reportes/`.
- **Base de datos**: Migración SQLite con nuevas tablas y columnas.
