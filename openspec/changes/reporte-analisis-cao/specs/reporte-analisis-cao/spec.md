## ADDED Requirements

### Requirement: Generar reporte de Análisis Comparativo de CAOs

El sistema SHALL generar un reporte ejecutivo de análisis comparativo de CAOs para un proyecto dado, replicando la estructura del reporte "ANALISIS" del archivo Excel de referencia.

#### Scenario: Obtener reporte ANALISIS para un proyecto con CAOs

- **GIVEN** un proyecto con 3+ planillas CAO registradas
- **WHEN** se hace GET a `/api/reportes/analisis-cao/:proyectoId`
- **THEN** el endpoint retorna un JSON con:
  - Datos del proyecto (nombre, contrato, supervisor, fiscal, contratista, fechas)
  - Tabla financiera: un array con **ANTICIPO como primer elemento (numero=0)** seguido de cada CAO (número, período, desembolso, descuento anticipo, líquido pagado, saldo por ejecutar, avance físico %, avance financiero %)
  - Totales acumulados de la tabla financiera (incluyendo el anticipo)
  - Anticipo: monto y porcentaje
  - Avance físico total (promedio de avancePct de todos los items de todas las CAOs)
  - Avance financiero total (suma de líquidos pagados / monto contrato)
  - Saldo por pagar (monto contrato - total desembolsado)

#### Scenario: Reporte ANALISIS con datos incompletos

- **GIVEN** un proyecto sin planillas CAO
- **WHEN** se hace GET a `/api/reportes/analisis-cao/:proyectoId`
- **THEN** el endpoint retorna un reporte con datos del proyecto y arrays vacíos en la tabla financiera, con saldo por pagar igual al monto del contrato

#### Scenario: Reporte ANALISIS con cálculo correcto de acumulados

- **GIVEN** un proyecto con anticipoMonto=2,000,000, CAO N°1 (ejecutado 100,000) y CAO N°2 (ejecutado 50,000)
- **WHEN** se genera el reporte
- **THEN** la tabla inicia con ANTICIPO (desembolso=2,000,000, líquido=2,000,000, saldo=montoContrato-2,000,000)
- **AND** CAO N°1 muestra desembolsoAcumulado = 2,000,000 + 100,000
- **AND** CAO N°2 muestra desembolsoAcumulado = 2,000,000 + 100,000 + 50,000
- **AND** el total desembolsado = 2,000,000 + 100,000 + 50,000

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

#### Scenario: Saldo por ejecutar (solo CAOs, excluye anticipo)

- **GIVEN** monto contrato = 16,903,840.54, anticipo = 2,328,000.00 y total desembolsos CAOs = 10,974,446.68
- **WHEN** se genera el reporte
- **THEN** total desembolsos = 10,974,446.68 (**excluye** el anticipo — solo suma desembolsos de CAOs)
- **AND** saldo por ejecutar = 16,903,840.54 - 10,974,446.68 = 5,929,393.86
- **AND** la fila ANTICIPO muestra saldo = 0 (el anticipo no tiene saldo por ejecutar)

### Requirement: Cálculo de avance físico y financiero

El sistema SHALL calcular:
- Avance físico de cada CAO: `desembolsoEfectuado / montoContrato` (porcentaje del monto del contrato ejecutado en el período)
- Avance financiero de cada CAO: `liquidoPagado / montoContrato` (donde líquidoPagado = desembolso - descuentoAnticipo)
- Avance físico total: `totalDesembolso / montoContrato` — **excluye** el anticipo (solo suma desembolsos de CAOs)
- Avance financiero total: `totalLiquido / montoContrato` — **incluye** el anticipo (totalLiquido comienza con anticipoMonto)
- ANTICIPO (numero=0): **avanceFisico=0** (el anticipo no representa avance físico de obra), avanceFinanciero=anticipoMonto/montoContrato

#### Scenario: Avance físico por CAO

- **GIVEN** CAO N°1 con desembolso 1,748,294.44 y monto contrato 16,903,840.54
- **WHEN** se genera el reporte
- **THEN** avance físico CAO N°1 = 1,748,294.44 / 16,903,840.54 = 0.1034 (10.34%)

#### Scenario: Avance financiero por CAO

- **GIVEN** CAO N°1 con desembolso 1,748,294.44, descuento 240,823.10 y monto contrato 16,903,840.54
- **WHEN** se genera el reporte
- **THEN** avance financiero CAO N°1 = (1,748,294.44 - 240,823.10) / 16,903,840.54 = 0.0892 (8.92%)

#### Scenario: Avance físico ante ANTICIPO

- **GIVEN** un proyecto con anticipoMonto=2,328,000.00
- **WHEN** se genera el reporte
- **THEN** la fila ANTICIPO tiene avanceFisico=0 (el anticipo es desembolso financiero, no ejecución física)
- **AND** avanceFinanciero=anticipoMonto/montoContrato (0.1377 = 13.77%)

#### Scenario: Totales excluyen anticipo en físico, lo incluyen en financiero

- **GIVEN** un proyecto con anticipoMonto=2,328,000.00, CAOs con desembolso total=10,974,446.68 y líquido total=10,617,906.12
- **WHEN** se genera el reporte
- **THEN** totalDesembolso=10,974,446.68 (solo CAOs, sin anticipo)
- **AND** totalLiquido=12,945,906.12 (anticipoMonto + líquido CAOs)
- **AND** avanceFisicoTotal=10,974,446.68/montoContrato (64.92%)
- **AND** avanceFinancieroTotal=12,945,906.12/montoContrato (76.58%)

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

#### Scenario: Certificado con solo 1 CAO

- **GIVEN** un proyecto con 1 sola CAO
- **WHEN** se hace GET a `/api/reportes/analisis-cao/1?hastaCao=1`
- **THEN** ejecutadoAcumuladoAnterior = 0
- **AND** ejecutadoPresentePeriodo = desembolso CAO 1
- **AND** descuentoAnticipoAcumuladoAnterior = 0
- **AND** multaAnterior = 0
- **AND** liquidoPagadoAcumuladoAnterior = 0

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

### Requirement: Fila ANTICIPO en tabla financiera

El sistema SHALL incluir una fila sintética ANTICIPO (numero=0) como primer elemento de la tabla financiera, antes de las filas CAO, representando el desembolso inicial del anticipo como líquido pagado.

#### Scenario: ANTICIPO en tabla financiera

- **GIVEN** un proyecto con anticipoMonto = 2,328,000.00
- **WHEN** se genera el reporte
- **THEN** la tabla financiera inicia con:
  - numero=0, periodo='ANTICIPO'
  - desembolsoEfectuado=0 (el anticipo no es desembolso de CAO), descuentoAnticipo=0
  - liquidoPagado=2,328,000.00, liquidoPagadoAcumulado=2,328,000.00
  - saldoPorEjecutar=0 (el saldo solo considera CAOs, no anticipo)
  - avanceFisico=0, avanceFinanciero=2,328,000.00/montoContrato

#### Scenario: ANTICIPO en PDF

- **GIVEN** un PDF generado para cualquier CAO
- **WHEN** se genera el PDF via `/api/reportes/cao/:planillaId/pdf`
- **THEN** la tabla del PDF incluye ANTICIPO como primera fila (no=0)
- **AND** la fila ANTICIPO muestra desembolso=anticipoMonto, descuento=0, líquido=anticipoMonto
- **AND** los totales del PDF incluyen el anticipo

#### Scenario: ANTICIPO no se muestra cuando anticipoMonto=0

- **GIVEN** un proyecto sin anticipo (anticipoMonto=0)
- **WHEN** se genera el reporte
- **THEN** la tabla financiera NO incluye la fila ANTICIPO

### Requirement: Visualización ANTICIPO en frontend

El frontend SHALL mostrar "ANTICIPO" en lugar de "CAO N° 0" para la fila con numero=0, tanto en la tabla como en la curva de avance.

#### Scenario: Tabla muestra ANTICIPO

- **WHEN** se renderiza la tabla financiera
- **THEN** la primera fila muestra "ANTICIPO" en lugar de "CAO N° 0"

#### Scenario: Curva de Avance muestra ANTICIPO

- **GIVEN** un reporte con ANTICIPO + N CAOs
- **WHEN** se renderiza la Curva de Avance (recharts)
- **THEN** el label del primer punto en el eje X es "ANTICIPO"
- **AND** el valor programado para ANTICIPO es 0%
- **AND** el valor programado para CAO N es N/(data.length-1)*100%

### Requirement: Curva de Avance con valores acumulados

La Curva de Avance SHALL mostrar valores **acumulados** (suma de todos los períodos anteriores), no valores individuales del período. Esto permite visualizar la evolución del avance a lo largo del tiempo.

#### Scenario: Curva acumulada correcta

- **GIVEN** un reporte con ANTICIPO (avanceFisico=0, avanceFinanciero=13.77%), CAO N°1 (avanceFisico=10.34%, avanceFinanciero=8.92%), CAO N°2 (avanceFisico=8.89%, avanceFinanciero=7.66%)
- **WHEN** se renderiza la Curva de Avance
- **THEN** cada punto se calcula acumulando desde el inicio:
  - ANTICIPO: ejecutadoFisico=0%, ejecutadoFinanciero=13.77%
  - CAO N°1: ejecutadoFisico=10.34%, ejecutadoFinanciero=22.69% (13.77%+8.92%)
  - CAO N°2: ejecutadoFisico=19.23%, ejecutadoFinanciero=30.35% (22.69%+7.66%)

#### Scenario: Línea programado es lineal

- **GIVEN** un reporte con 5 filas (ANTICIPO + 4 CAOs)
- **WHEN** se renderiza la Curva de Avance
- **THEN** programado = (row.numero / (totalRows-1)) * 100% para cada fila
- **AND** ANTICIPO (numero=0): programado=0%
- **AND** CAO N°4 (numero=4): programado=100%

## MODIFIED Requirements

### Requirement: Cálculo de avancePct

Se corrigió el cálculo de `avancePct` en el PATCH de items de planilla. Anteriormente usaba `?? 1` que no caía al fallback cuando `cantidadContrato=0`, resultando en `avancePct=0` siempre.

#### BEFORE: El fallback usaba `??` que preserva 0
```
const cc = it.cantidadContrato ?? baseItem?.cantidadContrato ?? 1;
// cuando baseItem.cantidadContrato = 0 → cc = 0 → avancePct = 0
```

#### AFTER: El fallback usa `||` para saltar 0
```
const cc = (it.cantidadContrato ?? baseItem?.cantidadContrato) || 1;
// cuando baseItem.cantidadContrato = 0 → cc = 1 → avancePct correcto
```

El fix se aplicó en las 3 ramas del PATCH handler (`planillas.service.ts`):
1. Rama `avanceId` (line 158): `?? 1` → `|| 1`
2. Rama `itemId + existing` (line 179): `?? 1` → `|| 1`
3. Rama `itemId + nuevo` (line 188): `?? 1` → `|| 1`

#### Scenario: avancePct correcto al PATCHear items

- **GIVEN** un avance con cantidad=50 y cantidadContrato=100 (item.cantidadContrato=0)
- **WHEN** se hace PATCH a `/api/planillas/:id/items` con `{ cantidad: 50 }`
- **THEN** avancePct = 50 / 1 * 100 = 5000% (usando fallback 1)
- **NOTA:** En realidad el backend también busca el Item para cantidadContrato, pero como Item.cantidadContrato siempre es 0 (importado del catálogo), el fallback a 1 es necesario

#### Scenario: Script de migración para datos existentes

- **GIVEN** avances con cantidadContrato>0 y avancePct=0
- **WHEN** se ejecuta `node scripts/migrate-avance-pct.js`
- **THEN** todos los avances con cantidadContrato>0 se actualizan: avancePct = (cantidad / cantidadContrato) * 100

- **GIVEN** un proyecto con 1 sola CAO
- **WHEN** se hace GET a `/api/reportes/analisis-cao/1?hastaCao=1`
- **THEN** ejecutadoAcumuladoAnterior = 0
- **AND** ejecutadoPresentePeriodo = desembolso CAO 1
- **AND** descuentoAnticipoAcumuladoAnterior = 0
- **AND** multaAnterior = 0
- **AND** liquidoPagadoAcumuladoAnterior = 0
