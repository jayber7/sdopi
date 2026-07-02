## Why

Los proyectos actualmente no tienen un ciclo de vida definido. Pasan por distintas fases (estudio, inversión, ejecución, conclusión) sin que el sistema lo refleje. Cada etapa tiene fechas de inicio y fin, y solo en "ejecución" deben poder crearse CAOs. Se necesita un modelo secuencial que registre la etapa actual del proyecto, su historial, y restrinja operaciones según la etapa.

## What Changes

- Nuevo campo `etapaActual` en `Proyecto` (enum: `estudio | inversion | ejecucion | concluido`, default `estudio`)
- Nuevo modelo `EtapaProyecto` para registrar histórico de transiciones (etapa, fechaInicio, fechaFin)
- Las etapas son secuenciales y no se puede retroceder
- Solo proyectos en etapa `ejecucion` pueden crear/modificar CAOs
- Restricción en backend: al crear CAO, validar que `proyecto.etapaActual === 'ejecucion'`
- La etapa se muestra en UI: formulario de proyecto, lista de proyectos, mapa
- Posibilidad de agregar más etapas en el futuro (campo enum extensible en string)

## Capabilities

### New Capabilities

- `etapa-lifecycle`: Modelo de datos, validaciones secuenciales, y restricción de CAOs por etapa
- `etapa-ui`: Selector de etapa en formulario de proyecto, visualización en lista y detalle

### Modified Capabilities

- *(ninguna — no se modifican specs existentes)*

## Impact

- **Backend**: Nuevo modelo `EtapaProyecto`, campo `etapaActual` en `Proyecto`, validación en `PlanillasService.create()` que solo permite CAOs si proyecto está en `ejecucion`
- **Frontend**: Selector de etapa en crear/editar proyecto, badge de etapa en lista y detalle, restricción de botón "+ Nueva" planilla según etapa
- **BD**: Nueva tabla `EtapaProyecto`, nueva columna `etapaActual` en `Proyecto`
