## ADDED Requirements

### Requirement: Generar reporte de Análisis Comparativo de CAOs

El sistema SHALL generar un reporte ejecutivo de análisis comparativo de CAOs para un proyecto dado, replicando la estructura del reporte "ANALISIS" del archivo Excel de referencia.

#### Scenario: Obtener reporte ANALISIS para un proyecto con CAOs

- **GIVEN** un proyecto con 3+ planillas CAO registradas
- **WHEN** se hace GET a `/api/reportes/analisis-cao/:proyectoId`
- **THEN** el endpoint retorna un JSON con:
  - Datos del proyecto (nombre, contrato, supervisor, fiscal, contratista, fechas)
  - Tabla financiera: un array con cada CAO (número, período, desembolso, descuento anticipo, líquido pagado, saldo por ejecutar, avance físico %, avance financiero %)
  - Totales acumulados de la tabla financiera
  - Anticipo: monto y porcentaje
  - Avance físico total (suma de avances físicos de todas las CAOs / monto contrato)
  - Avance financiero total (suma de líquidos pagados / monto contrato)
  - Saldo por pagar (monto contrato - total ejecutado)

#### Scenario: Reporte ANALISIS con datos incompletos

- **GIVEN** un proyecto sin planillas CAO
- **WHEN** se hace GET a `/api/reportes/analisis-cao/:proyectoId`
- **THEN** el endpoint retorna un reporte con datos del proyecto y arrays vacíos en la tabla financiera, con saldo por pagar igual al monto del contrato

#### Scenario: Reporte ANALISIS con cálculo correcto de acumulados

- **GIVEN** un proyecto con CAO N°1 (ejecutado 100,000) y CAO N°2 (ejecutado 50,000)
- **WHEN** se genera el reporte
- **THEN** la CAO N°2 muestra acumulado = 150,000, y el total muestra 150,000
- **AND** el avance financiero de CAO N°2 es acumulado/montoContrato

### Requirement: Cálculo de deducciones por anticipo

El sistema SHALL calcular la deducción por restitución de anticipo para cada CAO como `anticipoPct × montoEjecutado`, y mostrar el acumulado por período.

#### Scenario: Deducción de anticipo en CAO individual

- **GIVEN** un proyecto con anticipoPct = 13.7747448% y CAO N°1 con monto ejecutado = 1,748,294.44
- **WHEN** se genera el reporte
- **THEN** la deducción por anticipo de CAO N°1 = 1,748,294.44 × 0.137747448 = 240,823.10
- **AND** el descuento acumulado hasta CAO N°1 = 240,823.10

#### Scenario: Deducción de anticipo acumulada

- **GIVEN** CAO N°1 con deducción 240,823.10 y CAO N°2 con deducción 58,319.81
- **WHEN** se genera el reporte
- **THEN** CAO N°2 muestra descuento acumulado = 240,823.10 + 58,319.81 = 299,142.91

### Requirement: Cálculo de líquido pagado

El sistema SHALL calcular el líquido pagado de cada CAO como `desembolsoEjecutado - descuentoAnticipo`, y mostrar el acumulado.

#### Scenario: Líquido pagado individual y acumulado

- **GIVEN** CAO N°1 con desembolso 1,748,294.44 y descuento 240,823.10
- **WHEN** se genera el reporte
- **THEN** líquido pagado CAO N°1 = 1,507,471.34
- **AND** líquido pagado acumulado hasta CAO N°1 = 1,507,471.34

### Requirement: Cálculo de saldo por ejecutar

El sistema SHALL calcular el saldo por ejecutar como `montoContrato - totalDesembolsosEjecutados`.

#### Scenario: Saldo por ejecutar

- **GIVEN** monto contrato = 16,903,840.54 y total desembolsos = 10,974,446.68
- **WHEN** se genera el reporte
- **THEN** saldo por ejecutar = 5,929,393.86

### Requirement: Cálculo de avance físico y financiero

El sistema SHALL calcular:
- Avance físico de cada CAO: `cantidadEjecutadaPeriodo / cantidadTotalContrato` (promedio ponderado)
- Avance financiero de cada CAO: `desembolsoEjecutado / montoContrato`

#### Scenario: Avance físico por CAO

- **GIVEN** CAO N°3 con cantidad ejecutada en el período y cantidades totales del contrato por ítem
- **WHEN** se genera el reporte
- **THEN** el avance físico se calcula como la suma ponderada de (cantidadEjecutada / cantidadContrato) × (montoItem / montoTotal) para cada ítem

#### Scenario: Avance financiero por CAO

- **GIVEN** CAO N°1 con desembolso 1,748,294.44 y monto contrato 16,903,840.54
- **WHEN** se genera el reporte
- **THEN** avance financiero CAO N°1 = 1,748,294.44 / 16,903,840.54 = 0.1034 (10.34%)

### Requirement: Datos del desglose contractual

El sistema SHALL incluir en el reporte la sección de desglose contractual con:
- Monto del contrato
- Anticipo (monto y %)
- Monto según Orden de Trabajo N°1 (si existe)
- Monto según Orden de Cambio N°1 (si existe)

#### Scenario: Desglose contractual en reporte

- **GIVEN** un proyecto con monto contrato, anticipo, orden de trabajo y orden de cambio
- **WHEN** se genera el reporte
- **THEN** la respuesta incluye estos valores en una sección de datos contractuales

### Requirement: Filtro por CAO (hastaCao)

Los reportes SHALL aceptar un query param `?hastaCao=N` para generar el reporte con datos acumulativos **hasta esa CAO inclusive**, reflejando el comportamiento del Excel donde cada certificado muestra el estado del proyecto hasta ese punto.

#### Scenario: Reporte ANALISIS hasta CAO específica

- **GIVEN** un proyecto con 9 CAOs
- **WHEN** se hace GET a `/api/reportes/analisis-cao/1?hastaCao=3`
- **THEN** la tabla financiera contiene solo las CAOs N°1, N°2, N°3
- **AND** los totales reflejan la suma acumulada hasta CAO N°3
- **AND** la respuesta incluye `totalCaos: 9` (total real del proyecto)

#### Scenario: Reporte PLANILLAS hasta CAO específica

- **GIVEN** un proyecto con items y 9 CAOs
- **WHEN** se hace GET a `/api/reportes/planillas/1?hastaCao=3`
- **THEN** cada item muestra columnas solo para CAO N°1, N°2, N°3
- **AND** el acumulado por item es la suma hasta CAO N°3
- **AND** la respuesta incluye `totalCaos: 9`

#### Scenario: Sin parámetro hastaCao (default)

- **WHEN** se hace GET sin `?hastaCao`
- **THEN** se devuelven todas las CAOs del proyecto (comportamiento original)

### Requirement: Cálculo de retraso

El sistema SHALL calcular el retraso físico y financiero como `1 - avanceTotal`.

#### Scenario: Retraso en reporte

- **GIVEN** avance físico total = 0.6492 (64.92%)
- **WHEN** se genera el reporte
- **THEN** retraso físico = 0.3508 (35.08%)

### Requirement: Certificado Financiero (Planilla de Análisis)

El sistema SHALL generar un certificado financiero (Planilla de Análisis) con 18 líneas de desglose, organizadas en columnas Anterior / Presente / Acumulado a la fecha, replicando la estructura del Excel. Este certificado SHALL estar disponible cuando se usa el query param `?hastaCao=N`.

#### Scenario: Certificado financiero con CAO específica

- **GIVEN** un proyecto con 3+ CAOs
- **WHEN** se hace GET a `/api/reportes/analisis-cao/1?hastaCao=3`
- **THEN** la respuesta incluye una sección `certificado` con estas 18 líneas:

| # | Línea | Anterior (CAOs 1..N-1) | Presente (CAO N) | Acumulado |
|---|-------|------------------------|-------------------|-----------|
| 1 | Ejecutado acumulado anterior | — | — | Σ desembolso CAOs 1..N-1 |
| 2 | Ejecutado presente período | — | — | desembolso CAO N |
| 3 | Ejecutado acumulado a la fecha | — | — | (1) + (2) |
| 4 | Desc. anticipo acumulado anterior | — | — | Σ descuento CAOs 1..N-1 |
| 5 | Interés según contrato | — | — | anticipoPct |
| 6 | Desc. anticipo presente período | — | — | (2) × anticipoPct |
| 7 | Desc. anticipo acumulado a la fecha | — | — | (4) + (6) |
| 8 | Multa acumulado anterior | — | — | Σ multas CAOs 1..N-1 |
| 9 | Multa presente período | — | — | multas CAO N |
| 10 | Multa acumulado a la fecha | — | — | (8) + (9) |
| 11 | Total deducciones | — | — | (7) + (10) |
| 12 | Líquido pagado acumulado anterior | — | — | Σ líquido CAOs 1..N-1 |
| 13 | Líquido pagado acumulado a la fecha | — | — | Σ líquido CAOs 1..N |
| 14 | Líquido pagable planilla actual | — | — | (2) − (6) |
| 15 | Total líquido pagado acumulado a la fecha | — | — | (12) + (14) |
| 16 | Monto acumulado CAOs a la fecha | — | — | (3) |
| 17 | Saldo por restituir anticipo | — | — | anticipoMonto − (7) |
| 18 | Saldo efectivo por pagar | — | — | montoContrato − (3) |

#### Scenario: Certificado - valores numéricos correctos

- **GIVEN** proyecto con montoContrato=16,903,840.54, anticipoPct=13.7747448%
- **AND** CAO N°1: desembolso=1,748,294.44; CAO N°2: desembolso=1,502,233.73; CAO N°3: desembolso=1,448,724.65
- **WHEN** se genera certificado hasta CAO N°2
- **THEN** ejecutadoAcumuladoAnterior = 1,748,294.44 (solo CAO 1)
- **AND** ejecutadoPresentePeriodo = 1,502,233.73 (CAO 2)
- **AND** ejecutadoAcumuladoALaFecha = 3,250,528.17
- **AND** descuentoAnticipoPresentePeriodo = 206,928.86 (=1,502,233.73 × 0.137747448)

#### Scenario: Certificado sin hastaCao

- **GIVEN** un proyecto con CAOs
- **WHEN** se hace GET sin `?hastaCao`
- **THEN** la respuesta NO incluye la sección `certificado`

#### Scenario: Certificado con solo 1 CAO

- **GIVEN** un proyecto con 1 sola CAO
- **WHEN** se hace GET a `/api/reportes/analisis-cao/1?hastaCao=1`
- **THEN** ejecutadoAcumuladoAnterior = 0
- **AND** ejecutadoPresentePeriodo = desembolso CAO 1
- **AND** descuentoAnticipoAcumuladoAnterior = 0
- **AND** multaAnterior = 0
- **AND** liquidoPagadoAcumuladoAnterior = 0
