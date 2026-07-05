# Reporte Planilla Detalle

## Purpose
Genera un reporte detallado de planillas de avance de obra, mostrando ítem por ítem las cantidades ejecutadas en cada CAO, montos, y avance porcentual, replicando la estructura de la hoja "PLANILLAS" del Excel de referencia.

## Requirements

### Requirement: Generar reporte de Planillas de Avance (detalle por ítem)
El sistema SHALL generar un reporte detallado de planillas de avance de obra, mostrando ítem por ítem las cantidades ejecutadas en cada CAO.

#### Scenario: Obtener reporte PLANILLAS para un proyecto con items y CAOs
- **GIVEN** un proyecto con items de catálogo y 3+ planillas CAO con AvanceItems registrados
- **WHEN** se hace GET a `/api/reportes/planillas/:proyectoId`
- **THEN** el endpoint retorna un JSON con:
  - Datos del proyecto (nombre, contrato, fechas)
  - Array de rubros (M01, M02, etc.) cada uno con sus items
  - Para cada item: código, descripción, unidad, precio unitario, cantidad según contrato, monto original
  - Para cada item y cada CAO: cantidad ejecutada en el período, monto, avance porcentual
  - Totales por rubro y total general

#### Scenario: Reporte PLANILLAS con columnas de Orden de Trabajo
- **GIVEN** un proyecto con Orden de Trabajo N°1 que modificó cantidades
- **WHEN** se genera el reporte
- **THEN** cada item incluye columnas de cantidad y monto según Orden de Trabajo N°1
- **AND** se muestra el % de incremento/decremento respecto al contrato original

#### Scenario: Reporte PLANILLAS con avance acumulado
- **GIVEN** un proyecto con items ejecutados en múltiples CAOs
- **WHEN** se genera el reporte
- **THEN** cada item muestra columna "Avance Actual Acumulado" con cantidad total ejecutada hasta la fecha
- **AND** columna "% de Cantidad" (total ejecutado / cantidad contrato)
- **AND** columna "Monto Faltante" (monto contrato - total ejecutado)
- **AND** columna "% Monto Faltante"

### Requirement: Cálculo de avance porcentual por ítem
El sistema SHALL calcular el avance porcentual de cada ítem en cada CAO como `cantidadEjecutadaItem / cantidadTotalContratoItem`.

#### Scenario: Avance porcentual por ítem en CAO individual
- **GIVEN** un ítem con cantidad contrato = 40,377.64 M3 y en CAO N°1 ejecutó 6,630.30 M3
- **WHEN** se genera el reporte
- **THEN** avance % del ítem en CAO N°1 = 6,630.30 / 40,377.64 = 0.0679 (6.79%)

### Requirement: Agrupación por rubro
El sistema SHALL agrupar los items por rubro (categoría de obra) y mostrar subtotales por rubro.

#### Scenario: Items agrupados por rubro con subtotales
- **GIVEN** un proyecto con rubros M01 (6 items) y M02 (2 items)
- **WHEN** se genera el reporte
- **THEN** los items aparecen agrupados bajo su rubro correspondiente
- **AND** cada grupo de rubro muestra un subtotal de montos
- **AND** los rubros aparecen en orden (M01, M02, M03...)
