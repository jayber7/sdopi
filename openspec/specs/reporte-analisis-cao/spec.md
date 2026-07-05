# Reporte Análisis CAO

## Purpose
Genera un reporte ejecutivo de análisis comparativo de CAOs para un proyecto, replicando la estructura del reporte "ANALISIS" del Excel de referencia. Incluye tabla financiera con ANTICIPO, deducciones, líquido pagado, saldos, y cálculos de avance físico/financiero. También provee un certificado financiero (Planilla de Análisis) con 18 líneas de desglose cuando se especifica `?hastaCao=N`.

## Requirements

### Requirement: Generar reporte de Análisis Comparativo de CAOs
El sistema SHALL generar un reporte ejecutivo de análisis comparativo de CAOs para un proyecto dado.

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
- **AND** la fila ANTICIPO muestra saldo = 0

### Requirement: Cálculo de avance físico y financiero
El sistema SHALL calcular:
- Avance físico de cada CAO: `desembolsoEfectuado / montoContrato`
- Avance financiero de cada CAO: `liquidoPagado / montoContrato`
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
- **THEN** la fila ANTICIPO tiene avanceFisico=0
- **AND** avanceFinanciero=anticipoMonto/montoContrato (0.1377 = 13.77%)

#### Scenario: Totales excluyen anticipo en físico, lo incluyen en financiero
- **GIVEN** un proyecto con anticipoMonto=2,328,000.00, CAOs con desembolso total=10,974,446.68 y líquido total=10,617,906.12
- **WHEN** se genera el reporte
- **THEN** totalDesembolso=10,974,446.68 (solo CAOs)
- **AND** totalLiquido=12,945,906.12 (anticipoMonto + líquido CAOs)
- **AND** avanceFisicoTotal=10,974,446.68/montoContrato (64.92%)
- **AND** avanceFinancieroTotal=12,945,906.12/montoContrato (76.58%)

### Requirement: Filtro por CAO (hastaCao)
Los reportes SHALL aceptar un query param `?hastaCao=N` para generar el reporte con datos acumulativos **hasta esa CAO inclusive**.

#### Scenario: Reporte ANALISIS hasta CAO específica
- **GIVEN** un proyecto con 9 CAOs
- **WHEN** se hace GET a `/api/reportes/analisis-cao/1?hastaCao=3`
- **THEN** la tabla financiera contiene solo las CAOs N°1, N°2, N°3
- **AND** los totales reflejan la suma acumulada hasta CAO N°3
- **AND** la respuesta incluye `totalCaos: 9`

#### Scenario: Sin parámetro hastaCao (default)
- **WHEN** se hace GET sin `?hastaCao`
- **THEN** se devuelven todas las CAOs del proyecto

### Requirement: Certificado Financiero (Planilla de Análisis)
El sistema SHALL generar un certificado financiero con 18 líneas de desglose, disponible cuando se usa `?hastaCao=N`.

#### Scenario: Certificado financiero con CAO específica
- **GIVEN** un proyecto con 3+ CAOs
- **WHEN** se hace GET a `/api/reportes/analisis-cao/1?hastaCao=3`
- **THEN** la respuesta incluye una sección `certificado` con 18 líneas de desglose

#### Scenario: Certificado sin hastaCao
- **GIVEN** un proyecto con CAOs
- **WHEN** se hace GET sin `?hastaCao`
- **THEN** la respuesta NO incluye la sección `certificado`

### Requirement: Fila ANTICIPO en tabla financiera
El sistema SHALL incluir una fila sintética ANTICIPO (numero=0) como primer elemento de la tabla financiera.

#### Scenario: ANTICIPO en tabla financiera
- **GIVEN** un proyecto con anticipoMonto = 2,328,000.00
- **WHEN** se genera el reporte
- **THEN** la tabla financiera inicia con: numero=0, periodo='ANTICIPO', desembolsoEfectuado=0, descuentoAnticipo=0, liquidoPagado=2,328,000.00, saldoPorEjecutar=0, avanceFisico=0, avanceFinanciero=2,328,000.00/montoContrato

#### Scenario: ANTICIPO en PDF
- **GIVEN** un PDF generado para cualquier CAO
- **WHEN** se genera el PDF via `/api/reportes/cao/:planillaId/pdf`
- **THEN** la tabla del PDF incluye ANTICIPO como primera fila

#### Scenario: ANTICIPO no se muestra cuando anticipoMonto=0
- **GIVEN** un proyecto sin anticipo (anticipoMonto=0)
- **WHEN** se genera el reporte
- **THEN** la tabla financiera NO incluye la fila ANTICIPO

### Requirement: Visualización ANTICIPO en frontend
El frontend SHALL mostrar "ANTICIPO" en lugar de "CAO N° 0" para la fila con numero=0.

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
La Curva de Avance SHALL mostrar valores **acumulados** (suma de todos los períodos anteriores).

#### Scenario: Curva acumulada correcta
- **GIVEN** un reporte con ANTICIPO (avanceFisico=0, avanceFinanciero=13.77%), CAO N°1 (avanceFisico=10.34%, avanceFinanciero=8.92%)
- **WHEN** se renderiza la Curva de Avance
- **THEN** cada punto se calcula acumulando desde el inicio

### Requirement: Cálculo de retraso
El sistema SHALL calcular el retraso físico y financiero como `1 - avanceTotal`.
