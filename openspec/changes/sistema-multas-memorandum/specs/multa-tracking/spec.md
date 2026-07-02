## ADDED Requirements

### Requirement: Detección automática de retraso
El sistema SHALL calcular los días de retraso de un CAO cada vez que se consulta su detalle (`GET /planillas/:id`). Un CAO está en retraso si:
- Su `estado` no es `"aprobado"`
- Su `fechaFin` es anterior a la fecha actual

Los días de retraso SHALL calcularse como `hoy - fechaFin` (en días calendario).

#### Scenario: CAO sin retraso
- **WHEN** se consulta un CAO con `estado=aprobado` y `fechaFin` pasada
- **THEN** el sistema NO reporta días de retraso

#### Scenario: CAO con retraso
- **WHEN** se consulta un CAO con `estado=borrador` y `fechaFin=2026-03-31` y hoy es `2026-04-15`
- **THEN** el sistema reporta `diasRetraso: 15`

### Requirement: Persistencia de multas
El sistema SHALL almacenar registros de multa en la tabla `Multa` con los siguientes campos:
- `id` (autoincremental)
- `planillaCAOId` (FK a PlanillaCAO)
- `proyectoId` (FK a Proyecto)
- `fechaInicio` (inicio del periodo de retraso)
- `fechaFin` (fin del periodo de retraso)
- `dias` (número de días del periodo)
- `montoDiario` (monto por día, copiado del proyecto al momento de creación)
- `montoTotal` (días × montoDiario)
- `memorandumRef` (código único, ej: "MEM-001/2026")
- `estado` ("pendiente" | "pagada" | "anulada")
- `createdAt`

#### Scenario: Crear multa desde CAO con retraso
- **WHEN** un administrador genera una multa para un CAO con 15 días de retraso y `montoDiario=8000`
- **THEN** se crea un registro `Multa` con `dias=15`, `montoDiario=8000`, `montoTotal=120000`, `estado="pendiente"`

### Requirement: Multa diaria configurable por proyecto
El proyecto SHALL tener un campo `multaDiaria` (Float) con default 8000. Este valor se usa al calcular el monto de cada multa generada para los CAOs de ese proyecto.

#### Scenario: Proyecto con multa personalizada
- **WHEN** se actualiza `multaDiaria=10000` en un proyecto
- **THEN** las multas generadas posteriormente usan ese valor en lugar de 8000
- **AND** las multas ya creadas conservan su `montoDiario` original

### Requirement: Aprobación con deuda pendiente
El sistema SHALL permitir aprobar un CAO aunque tenga multas pendientes. La aprobación NO queda bloqueada por la existencia de multas.

#### Scenario: Aprobar CAO con retraso
- **WHEN** un admin aprueba un CAO que tiene multas en estado "pendiente"
- **THEN** el CAO pasa a estado "aprobado"
- **AND** las multas permanecen en estado "pendiente"
