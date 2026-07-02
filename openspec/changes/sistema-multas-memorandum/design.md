## Context

Actualmente los CAOs tienen `fechaInicio` y `fechaFin` pero no existe ningún mecanismo que monitoree si se aprobaron dentro del plazo. El sistema solo gestiona el flujo `borrador → enviado → aprobado` sin contabilizar retrasos. Se necesita agregar:

1. Cálculo de retrasos en tiempo real (al consultar planillas)
2. Persistencia de multas con montos
3. Generación de PDF memorandum
4. Alertas visuales en UI

## Goals / Non-Goals

**Goals:**
- Modelo `Multa` en Prisma con relación a `PlanillaCAO` y `Proyecto`
- Campo `multaDiaria` configurable en `Proyecto`
- Cálculo de retraso integrado en `GET /api/planillas/:id`
- Endpoints CRUD para multas + generación de PDF
- Vista de alerta en frontend (proyectos list y detalle CAO)
- Generación de PDF con pdfkit (librería liviana, sin Puppeteer)

**Non-Goals:**
- Programa batch / cron job diario (el cálculo es en tiempo real)
- Envío automático de emails o notificaciones
- Integración con sistemas contables externos
- Firma digital en PDF

## Decisions

### 1. Librería PDF: pdfkit sobre Puppeteer
**Decisión:** Usar `pdfkit` para generar PDFs del lado del servidor.
**Razón:** Puppeteer requiere instalar Chromium (~300MB) y es complejo en servidores headless. pdfkit es liviano y genera PDFs directamente desde Node.js. Para un documento simple como un memorandum es más que suficiente.
**Alternativa considerada:** Puppeteer — descartado por sobrecarga de dependencias.

### 2. Cálculo en tiempo real vs programado
**Decisión:** El retraso se calcula en tiempo real al consultar `GET /api/planillas/:id`.
**Razón:** No requiere infraestructura de background jobs. El cálculo es simple (fechaActual - fechaFin) y rápido. Las multas se persisten solo cuando el admin las formaliza (POST /planillas/:id/multas).
**Alternativa considerada:** Cron diario que persiste automáticamente — descartado porque el usuario prefiere control manual sobre cuándo crear multas.

### 3. Código memorandum correlativo por año
**Decisión:** Secuencia MEM-{correlativo}/{año} reseteable cada año.
**Razón:** Formato estándar para documentos administrativos. Se implementa consultando el MAX de memorandumRef del año actual en la tabla Multa.

### 4. Almacenamiento de PDF
**Decisión:** PDF generado bajo demanda (cada vez que se solicita), no se almacena en disco.
**Razón:** Simplifica el modelo de datos. Si se necesita archivo permanente en el futuro, se puede agregar almacenamiento S3/disco con la referencia en la BD.

## Estructura de datos

### Prisma schema (adiciones)

```prisma
model Multa {
  id              Int      @id @default(autoincrement())
  planillaCAOId   Int
  proyectoId      Int
  fechaInicio     DateTime
  fechaFin        DateTime
  dias            Int
  montoDiario     Float
  montoTotal      Float
  memorandumRef   String   @unique
  estado          String   @default("pendiente")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  planillaCAO PlanillaCAO @relation(fields: [planillaCAOId], references: [id], onDelete: Cascade)
  proyecto    Proyecto    @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
}

model Proyecto {
  // ... existing fields ...
  multaDiaria Float @default(8000)
  multas      Multa[]
}
```

### API Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/planillas/:id` | JWT | Incluye campo `retraso` con días, monto potencial, y multas existentes |
| `POST` | `/api/planillas/:id/multas` | admin | Crea una multa con los días de retraso actuales |
| `GET` | `/api/planillas/:id/multas` | JWT | Lista multas del CAO |
| `GET` | `/api/multas/:id/memorandum` | JWT | Descarga PDF de la multa |
| `PATCH` | `/api/multas/:id` | admin | Actualiza estado de multa |
| `PATCH` | `/api/proyectos/:id` | admin, operador | Incluye `multaDiaria` en el body |

### Frontend components

- **`MultaBadge`**: Indicador visual en lista de proyectos (`/proyectos`)
- **`RetrasoAlerta`**: Bloque de alerta en detalle de CAO con días, monto, botón generar PDF
- **`MultaList`**: Tabla de multas del CAO con estado y acciones

## Flujo de datos

```
                ┌─────────────────────────┐
                │  GET /api/planillas/:id   │
                └──────────┬──────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  PlanillasService        │
              │  .findOne()              │
              │                          │
              │  1. Consulta planilla    │
              │  2. Si tipo=CAO:         │
              │     a. getHistorial()    │
              │     b. getRetraso()      │ ← NEW
              │        ├─ ¿fechaFin <    │
              │        │   hoy?          │
              │        ├─ dias = hoy -   │
              │        │   fechaFin      │
              │        ├─ montoPotencial │
              │        │   = dias *      │
              │        │   multaDiaria   │
              │        └─ incluir multas │
              │  3. Retorna planilla     │
              │     + historico          │
              │     + retraso            │ ← NEW
              └─────────────────────────┘

                ┌─────────────────────────┐
                │  POST /planillas/:id/    │
                │  multas                  │
                └──────────┬──────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  1. Calcular retraso    │
              │  2. Crear registro      │
              │     Multa               │
              │  3. Generar correlativo │
              │  4. Retornar Multa      │
              └─────────────────────────┘

                ┌─────────────────────────┐
                │  GET /multas/:id/        │
                │  memorandum              │
                └──────────┬──────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  1. Buscar Multa        │
              │  2. Buscar Planilla     │
              │  3. Buscar Proyecto     │
              │  4. Generar PDF         │
              │     con pdfkit          │
              │  5. Retornar PDF        │
              └─────────────────────────┘
```

## Risks / Trade-offs

- **[Rendimiento]** Calcular retraso en cada GET de planilla agrega overhead mínimo (una resta de fechas y count de multas). No debería afectar performance.
- **[Precisión de fechas]** El cálculo usa fechas del servidor. Si el servidor está en zona horaria diferente, los días podrían diferir. → Usar UTC para consistencia.
- **[PDF generado bajo demanda]** Si hay muchas solicitudes simultáneas de PDF, puede aumentar la latencia. → Para este sistema de uso interno no es un problema real.
