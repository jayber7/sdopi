## ADDED Requirements

### Requirement: Gestión de multas por planilla

El sistema SHALL permitir registrar y consultar multas asociadas a una planilla CAO, que se deducen del líquido pagable.

#### Scenario: Crear multa para una planilla

- **GIVEN** una planilla CAO existente
- **WHEN** se hace POST a `/api/multas` con `{ planillaId, monto, descripcion, fecha }`
- **THEN** se crea una multa asociada a la planilla
- **AND** la respuesta incluye el ID de la multa creada

#### Scenario: Listar multas de una planilla

- **GIVEN** una planilla con 2 multas registradas
- **WHEN** se hace GET a `/api/multas?planillaId=:id`
- **THEN** retorna un array con las 2 multas
- **AND** cada multa incluye monto, descripción y fecha

#### Scenario: Eliminar multa

- **GIVEN** una multa existente
- **WHEN** se hace DELETE a `/api/multas/:id`
- **THEN** la multa se elimina

### Requirement: Gestión de desembolsos programados

El sistema SHALL permitir registrar y consultar el calendario de desembolsos programados para un proyecto (curva de inversión programada).

#### Scenario: Crear desembolso programado

- **GIVEN** un proyecto existente
- **WHEN** se hace POST a `/api/desembolsos-programados` con `{ proyectoId, mes, montoProgramado, descripcion }`
- **THEN** se crea un registro de desembolso programado

#### Scenario: Listar desembolsos programados vs ejecutados

- **GIVEN** un proyecto con 5 desembolsos programados y 3 CAOs ejecutadas
- **WHEN** se hace GET a `/api/desembolsos-programados/:proyectoId`
- **THEN** retorna un array combinado que para cada mes muestra:
  - Monto programado
  - Monto ejecutado (suma de desembolsos de CAOs en ese mes)
  - Diferencia
  - % de ejecución respecto a programado

### Requirement: Campos extendidos de Proyecto

El sistema SHALL extender el modelo Proyecto con campos para el anticipo contractual.

#### Scenario: Proyecto con anticipo

- **GIVEN** la migración aplicada
- **WHEN** se crea o actualiza un proyecto
- **THEN** se pueden especificar `anticipoMonto` (Float) y `anticipoPct` (Float, default 13.7747448)
- **AND** los endpoints existentes de proyecto incluyen estos campos
