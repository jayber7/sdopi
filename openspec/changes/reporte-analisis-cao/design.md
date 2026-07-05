## Context

El sistema actual gestiona proyectos, planillas CAO, items de avance y evidencias fotográficas. Los reportes de análisis comparativo se hacen manualmente en Excel. El archivo de referencia (`Docs/ANALISIS DE CAO ROSARIO DEL INGRE V4.xlsm`) contiene dos reportes principales:

1. **ANALISIS**: Reporte ejecutivo con tabla financiera consolidada de todas las CAOs del proyecto (N°1 al N°10), desglose contractual, deducciones, y avance físico/financiero.
2. **PLANILLAS**: Desglose ítem por ítem de cada CAO con cantidades ejecutadas por período.

Ambos reportes se generarám del lado del backend como JSON, y el frontend los renderizará en tabla + gráficos con Tailwind CSS.

## Goals / Non-Goals

**Goals:**
- Generar el reporte ANALISIS (tabla financiera consolidada) para un proyecto dado.
- Generar el reporte PLANILLAS (detalle ítem por ítem) para un proyecto dado.
- Extender el modelo de datos para cubrir multas y desembolsos programados.
- Mostrar ambos reportes en el frontend con capacidad de imprimir.
- Curva de avance físico vs financiero (programado vs ejecutado).

**Non-Goals:**
- Exportación a PDF del lado del servidor (se usará impresión nativa del navegador).
- Carga masiva de datos desde Excel.
- Edición de reportes (solo consulta).
- Modificar el módulo de evidencias o autenticación.

## Decisions

1. **Backend: módulo `reportes/` separado**
   - Nuevo módulo NestJS con sus propios controller, service, DTOs.
   - No acoplar a planillas/ ni proyectos/ — los reportes son consultas complejas de solo lectura.

2. **Cálculo en backend, no en base de datos**
   - Los reportes requieren lógica de negocio (cálculo de acumulados, deducciones, saldos).
   - Se usarán servicios que consultan Prisma y procesan los datos en TypeScript.
   - La base de datos (SQLite) no soporta window functions complejas de forma performante.

3. **Modelos nuevos vs campos extendidos**
   - `DesembolsoProgramado`: nueva tabla para la curva de desembolsos (programado vs ejecutado).
   - `Multa`: nueva tabla para deducciones por multa por planilla.
   - `Proyecto.anticipoMonto` y `Proyecto.anticipoPct`: campos nuevos en Proyecto para el anticipo contractual.
   - Las deducciones por anticipo se calculan (existe `anticipoPct` × monto ejecutado), no se guardan.

4. **Frontend: ruta `/reportes/[proyectoId]`**
   - Página standalone con selector de reporte (ANALISIS / PLANILLAS).
   - Componentes: `TablaFinanciera`, `TablaDetalleItems`, `CurvaAvance` (gráfico con Chart.js o similar).
   - Botón de imprimir que usa `window.print()` con estilos específicos para papel.

5. **Sin nueva dependencia de gráficos** — Chart.js via CDN o `recharts` si ya existe en el proyecto.

## Risks / Trade-offs

- **Cálculos en memoria**: Si un proyecto tiene muchos items (100+) y 10 CAOs, el volumen de datos es manejable (< 10k registros). Si escala a cientos de items, considerar paginación o caché.
- **SQLite sin window functions robustas**: Los acumulados se calculan en TypeScript iterando CAOs ordenadas por número. Esto es correcto pero más código que una query SQL con SUM OVER.
- **Impresión nativa del navegador**: No genera PDF en servidor, depende del cliente. Es aceptable para un sistema interno.
