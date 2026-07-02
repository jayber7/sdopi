## ADDED Requirements

### Requirement: Endpoint para crear multa
El sistema SHALL exponer `POST /api/planillas/:id/multas` que:
- Calcula los días de retraso hasta la fecha actual
- Crea un registro `Multa` con los datos calculados
- Genera un código `memorandumRef` único
- Retorna la multa creada

#### Scenario: Crear multa exitosamente
- **WHEN** un admin hace POST a `/api/planillas/42/multas`
- **THEN** se crea una multa con `dias` calculados, `montoTotal` calculado, y `estado="pendiente"`
- **AND** retorna HTTP 201 con los datos de la multa

### Requirement: Endpoint para listar multas de CAO
El sistema SHALL exponer `GET /api/planillas/:id/multas` que retorna todas las multas de un CAO.

#### Scenario: Listar multas
- **WHEN** se consulta `GET /api/planillas/42/multas`
- **THEN** retorna un array con todas las multas del CAO, ordenadas por fecha descendente

### Requirement: Endpoint para generar PDF
El sistema SHALL exponer `GET /api/multas/:id/memorandum` que genera y descarga el PDF de una multa específica.

#### Scenario: Descargar PDF
- **WHEN** se accede a `GET /api/multas/5/memorandum`
- **THEN** retorna el PDF con `Content-Type: application/pdf`
- **AND** nombre de archivo `MEM-001-2026.pdf`

### Requirement: Endpoint para actualizar estado de multa
El sistema SHALL exponer `PATCH /api/multas/:id` para cambiar el `estado` de una multa ("pagada" | "anulada").

#### Scenario: Pagar multa
- **WHEN** un admin hace PATCH a `/api/multas/5` con `{"estado": "pagada"}`
- **THEN** la multa cambia su estado a "pagada"

### Requirement: Calcular retraso en GET planilla
El endpoint `GET /api/planillas/:id` SHALL incluir un campo `retraso` con:
- `dias`: días de retraso (0 si no hay retraso)
- `montoPotencial`: monto acumulado si se generara multa hoy (días × multaDiaria)
- `multas`: array de multas existentes del CAO

#### Scenario: GET planilla con retraso
- **WHEN** se consulta `GET /api/planillas/42`
- **THEN** la respuesta incluye `retraso.dias`, `retraso.montoPotencial`, y `retraso.multas` si el CAO está en retraso
