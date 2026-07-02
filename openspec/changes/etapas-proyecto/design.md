## Context

Actualmente el modelo `Proyecto` no tiene concepto de etapa/ciclo de vida. Solo tiene `activo: Boolean` para borrado lógico. En el mapa existen estados `normal | observado | alerta | concluido` pero son datos hardcodeados por municipio, no por proyecto.

Se necesita un lifecycle secuencial: `estudio → inversion → ejecucion → concluido`, donde cada etapa tiene fechas y solo "ejecucion" permite CAOs.

## Goals / Non-Goals

**Goals:**
- Campo `etapaActual` en Proyecto con valores secuenciales
- Modelo `EtapaProyecto` para histórico de transiciones
- Validación backend que solo permite CAOs en etapa "ejecucion"
- Selector de etapa en UI (solo muestra opciones válidas)
- Badge de etapa en lista y detalle de proyecto

**Non-Goals:**
- Workflows automáticos de transición (el cambio es manual por ahora)
- Notificaciones al cambiar de etapa
- Reportes históricos de duración por etapa

## Decisions

### 1. String vs Enum en Prisma
**Decisión:** Usar `String` en Prisma con validación en TypeScript.
**Razón:** El usuario dijo que las etapas están "aún por establecer". Un string permite agregar nuevos valores (ej: "planificacion", "licitacion") sin migraciones de BD. La validación de valores permitidos se hace en el servicio.
**Alternativa:** Prisma enum — más estricto pero requiere migración para agregar valores.

### 2. Modelo separado para histórico
**Decisión:** Crear `EtapaProyecto` como modelo separado.
**Razón:** Necesitamos fechas de inicio y fin por etapa. Un simple string en Proyecto no da trazabilidad. El modelo separado permite consultar "cuánto duró en estudio" o "cuándo pasó a ejecución".

### 3. Restricción de CAOs
**Decisión:** Validar en `PlanillasService.create()` antes de crear el CAO.
**Razón:** Es el punto central donde se crean planillas. También se validará en frontend ocultando el botón, pero la validación real va en backend.

## Estructura de datos

### Prisma schema (adiciones)

```prisma
model Proyecto {
  // ... existing fields ...
  etapaActual   String          @default("estudio")
  etapas        EtapaProyecto[]
}

model EtapaProyecto {
  id          Int      @id @default(autoincrement())
  proyectoId  Int
  etapa       String
  fechaInicio DateTime @default(now())
  fechaFin    DateTime?
  proyecto    Proyecto @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
}
```

### Etapas válidas y orden

```
const ETAPAS = ['estudio', 'inversion', 'ejecucion', 'concluido'] as const;

function puedeTransicionar(actual: string, nueva: string): boolean {
  const idxActual = ETAPAS.indexOf(actual);
  const idxNueva = ETAPAS.indexOf(nueva);
  return idxNueva === idxActual + 1;  // solo un paso adelante
}
```

## Flujo

```
Proyecto creado
  │ etapaActual = "estudio"
  ▼
[Admin cambia a "inversion"]
  │ → Cierra EtapaProyecto "estudio" (fechaFin = now)
  │ → Crea EtapaProyecto "inversion" (fechaInicio = now)
  │ → Proyecto.etapaActual = "inversion"
  ▼
[Admin cambia a "ejecucion"]
  │ → Cierra EtapaProyecto "inversion"
  │ → Crea EtapaProyecto "ejecucion"
  │ → Proyecto.etapaActual = "ejecucion"
  │ → Ahora se pueden crear CAOs
  ▼
[Admin cambia a "concluido"]
  │ → Cierra EtapaProyecto "ejecucion"
  │ → Crea EtapaProyecto "concluido"
  │ → NO más CAOs
```

## Risks / Trade-offs

- **[Datos actuales]** Los proyectos existentes en BD tendrán `etapaActual = "estudio"` (default). Habrá que migrarlos manualmente a la etapa correcta después del deploy.
- **[Extensibilidad]** Usar String en vez de enum permite agregar etapas sin migración, pero pierde type-safety de Prisma. Compensamos con validación en servicio.
- **[Mapa]** El `estado` del mapa (normal/observado/alerta) es independiente de la `etapa`. Son conceptos ortogonales: uno es salud/desempeño, el otro es ciclo de vida.
