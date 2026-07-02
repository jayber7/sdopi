# Evidencia Fotográfica

## Purpose

Gestiona la evidencia fotográfica georreferenciada por cada ítem (AvanceItem) de una planilla CAO. Cada ítem puede tener una o más fotos con verificación GPS (EXIF + Haversine). Un panel integrado en la vista de planilla permite administrar y visualizar el estado de las evidencias. La verificación geoespacial previene fraudes cruzando coordenadas EXIF de la foto vs coordenadas del proyecto.

---

## Requirements

### Requirement: Modelo de datos

ADDED `EvidenciaFotografica` en Prisma schema:

```
EvidenciaFotografica {
  id                     Int              @id @default(autoincrement())
  url                    String           (Cloudinary)
  publicId               String
  // EXIF metadata
  exifLatitud            Float?
  exifLongitud           Float?
  exifAltitud            Float?
  exifFechaCaptura       DateTime?
  exifDispositivo        String?
  exifModeloCamara       String?
  exifTieneGPS           Boolean          @default(false)
  // Geo-verificación
  verificacionEstado     EstadoEvidencia  @default(PENDIENTE)
  verificacionDistancia  Float?
  verificacionRadio      Int              @default(500)
  verificacionFuente     String?          // "exif" | "browser"
  verificacionObservaciones String?
  // Metadata
  categoria              CategoriaEvidencia @default(VISTA_GENERAL)
  descripcion            String?
  // FK obligatoria a AvanceItem
  avanceItemId           Int
  avanceItem             AvanceItem       @relation(fields: [avanceItemId], references: [id], onDelete: Cascade)
  // FK denormalizada a planilla (para listar rápido)
  planillaId             Int
  planilla               PlanillaCAO      @relation(fields: [planillaId], references: [id], onDelete: Cascade)
  // FK a usuario que registró
  userId                 Int
  user                   User             @relation(fields: [userId], references: [id])
  createdAt              DateTime         @default(now())
}

enum EstadoEvidencia { PENDIENTE VERIFICADO SOSPECHOSO RECHAZADO }
enum CategoriaEvidencia { VISTA_GENERAL DETALLE_CONSTRUCCION MATERIAL EQUIPO PERSONAL ANTES DESPUES }
```

ADDED rol `supervisor` al modelo User. Roles válidos: `admin`, `supervisor`, `operador`, `consulta`.

### Requirement: Upload de Foto con Verificación

#### Scenario: Subir foto verificada a un AvanceItem
- GIVEN una planilla en estado `borrador`
- GIVEN un AvanceItem existente con `itemId` no nulo
- WHEN un `operador` envía `POST /api/planillas/:planillaId/fotos/:avanceItemId` con:
  - `foto` (multipart, JPEG, max 20MB)
  - `categoria` (enum)
  - `descripcion` (opcional)
  - `browserGpsLat` / `browserGpsLng` (opcional, fallback)
- THEN el servidor:
  1. Sube la imagen a Cloudinary (carpeta `sdop/evidencias`)
  2. Extrae EXIF con `exifr` (GPS, fecha, dispositivo, modelo)
  3. Calcula distancia Haversine entre GPS de la foto y coordenadas del proyecto
  4. Usa EXIF GPS como fuente primaria; si no tiene EXIF GPS, usa `browserGpsLat`/`browserGpsLng`
  5. Sin GPS de ninguna fuente → `PENDIENTE`
  6. Distancia <= radio → `VERIFICADO`
  7. Distancia > radio → `SOSPECHOSO`
  8. Guarda `EvidenciaFotografica` con todos los datos
- THEN devuelve 201 con la evidencia creada

#### Scenario: Subir foto a planilla enviada/aprobada
- WHEN un operador intenta subir foto a planilla en estado `enviado` o `aprobado`
- THEN 400 Bad Request: "No se pueden agregar fotos a una planilla que no está en borrador"

#### Scenario: Subir foto a ítem sin itemId (extra item)
- WHEN un operador intenta subir foto a un AvanceItem con `itemId: null`
- THEN 400 Bad Request: "Solo los ítems del catálogo pueden tener evidencia fotográfica"

### Requirement: Rechazar / Restaurar Evidencia

#### Scenario: Rechazar foto por supervisor
- GIVEN una evidencia en estado `VERIFICADO` o `SOSPECHOSO`
- WHEN un `supervisor` o `admin` envía `PATCH /api/evidencias/:id/rechazar` con `observaciones`
- THEN la evidencia cambia a `RECHAZADO`
- AND se registra `verificacionObservaciones`

#### Scenario: Restaurar evidencia
- GIVEN una evidencia en estado `RECHAZADO`
- WHEN un `admin` envía `PATCH /api/evidencias/:id/restaurar`
- THEN la evidencia vuelve al estado anterior (el que tenía antes de RECHAZADO)

### Requirement: Listar y Estadísticas

#### Scenario: Listar evidencias de una planilla
- WHEN `GET /api/planillas/:planillaId/fotos`
- THEN devuelve todas las `EvidenciaFotografica` de la planilla incluyendo avanceItem
- AND cada item incluye su número, descripción y unidad

#### Scenario: Estadísticas por planilla
- WHEN `GET /api/planillas/:planillaId/fotos/stats`
- THEN devuelve:
  ```json
  {
    "total": 15,
    "verificadas": 12,
    "sospechosas": 2,
    "rechazadas": 1,
    "itemsSinEvidencia": 3,
    "itemsTotal": 15,
    "porItem": {
      "42": { "count": 2, "mejorEstado": "VERIFICADO" },
      "43": { "count": 0, "mejorEstado": null },
      "44": { "count": 1, "mejorEstado": "SOSPECHOSO" }
    }
  }
  ```

### Requirement: Evidencia en respuesta de planilla

MODIFIED `GET /api/planillas/:id` — cada `AvanceItem` incluye:

```json
{
  "evidencia": {
    "count": 2,
    "mejorEstado": "VERIFICADO",
    "estados": ["VERIFICADO", "VERIFICADO"]
  }
}
```

Resuelto con una subquery SQL o agregación en memoria.

### Requirement: Validación en aprobación

MODIFIED `PATCH /api/planillas/:id/aprobar`:
- Verifica que todos los AvanceItem con `itemId != null` tengan al menos una evidencia `VERIFICADO`
- Si algún item no cumple → 400: "Todos los ítems del catálogo deben tener evidencia fotográfica verificada. Items pendientes: N°1, N°3, N°7"
- Admin puede saltar con `?force=true` → se aprueba igual y se registra "Aprobación forzada por admin — evidencias incompletas"

### Requirement: Eliminar evidencia

#### Scenario: Eliminar evidencia
- GIVEN una evidencia existente
- WHEN `DELETE /api/evidencias/:id` por `admin` o `supervisor`
- THEN se elimina la imagen de Cloudinary
- AND se elimina el registro de la BD

---

## Security & Access

| Acción | admin | supervisor | operador | consulta |
|--------|-------|------------|----------|----------|
| Ver panel evidencias | ✓ | ✓ | ✓ | ✓ |
| Subir foto (borrador) | ✓ | ✗ | ✓ | ✗ |
| Eliminar propia foto | ✓ | ✗ | ✓ | ✗ |
| Rechazar foto | ✓ | ✓ | ✗ | ✗ |
| Restaurar foto | ✓ | ✗ | ✗ | ✗ |
| Aprobar planilla (requiere evidencia) | ✓ | ✗ | ✗ | ✗ |
| Forzar aprobación | ✓ | ✗ | ✗ | ✗ |

---

## Frontend

### Requirement: Columna Evidencia en Grid CAO

ADDED columna al inicio de cada fila de `AvanceItem` en `CAOGrid`:

- Botón circular (36px) con:
  - Sin fotos → círculo gris `○`
  - `VERIFICADO` → check verde `✓` sobre fondo `var(--color-success-light)`
  - `SOSPECHOSO` → exclamación amarilla `⚠` sobre fondo `var(--color-warning-light)`
  - `RECHAZADO` → equis roja `✗` sobre fondo `var(--color-error-light)`
  - `PENDIENTE` → interrogante naranja `?`
- Tooltip: "2 fotos · VERIFICADO"
- Click abre Panel de Evidencias para ese AvanceItem
- Si planilla en borrador y rol operador/admin, el botón sin fotos muestra `+` en lugar de `○`

### Requirement: Panel de Evidencias (Modal)

ADDED modal por ítem:

**Cabecera:**
- "Evidencia Fotográfica — Item N°{numero}: {descripcion}"
- Badge del mejor estado
- Botón "Agregar foto" (borrador + operador/admin)

**Cuerpo:**
- Grid de tarjetas de foto, cada una con:
  - Thumbnail 150x150, click para expandir (imagen completa en modal secundario)
  - Badge estado
  - EXIF: coordenadas, fecha captura, dispositivo
  - Distancia a la obra (metros)
  - Categoría + descripción
  - Botón eliminar (operador/admin en borrador)
  - Botón rechazar (supervisor/admin)

**Sin fotos:** "No hay evidencia fotográfica para este ítem"

### Requirement: Upload de Foto

ADDED formulario dentro del Panel de Evidencias:

1. Selector de archivo con `capture="environment"` para móvil
2. Dropdown de categoría (VISTA_GENERAL, DETALLE_CONSTRUCCION, MATERIAL, EQUIPO, PERSONAL, ANTES, DESPUES)
3. Textarea de descripción (opcional)
4. Captura automática de GPS del navegador con `navigator.geolocation.getCurrentPosition`
5. Preview de imagen seleccionada
6. Botón "Subir" con loader
7. Al completar: la foto aparece en el grid del panel

### Requirement: Panel General de Evidencias

ADDED botón en cabecera de planilla:

```
📷 Evidencias: 12/15 verificadas
```

- Conteo: fotos verificadas / total items con itemId
- Color: verde (100%), amarillo (hay sospechosas), rojo (hay rechazadas/gris)
- Abre modal con lista completa de todos los ítems y su estado de evidencia, agrupado por rubro
- Cada fila muestra: N°, descripción, conteo de fotos, mejor estado, acciones

---

## API Reference

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/planillas/:planillaId/fotos/:avanceItemId` | operador, admin | Subir foto + verificación |
| `GET` | `/api/planillas/:planillaId/fotos` | * | Listar evidencias |
| `GET` | `/api/planillas/:planillaId/fotos/stats` | * | Estadísticas por planilla |
| `GET` | `/api/evidencias/:id` | * | Detalle evidencia |
| `DELETE` | `/api/evidencias/:id` | admin, supervisor | Eliminar evidencia |
| `PATCH` | `/api/evidencias/:id/rechazar` | admin, supervisor | Rechazar evidencia |
| `PATCH` | `/api/evidencias/:id/restaurar` | admin | Restaurar evidencia |

---

## Storage

Cloudinary configuración existente o ADDED:

```
Carpeta: sdop/evidencias
Formato: jpg
Transformación: quality: 'auto:good', fetch_format: 'jpg'
Límite: 20MB por archivo
```

---

## Tasks

1. **Prisma:** Agregar modelos `EvidenciaFotografica`, `EstadoEvidencia`, `CategoriaEvidencia` y rol `supervisor`
2. **Prisma:** Ejecutar migración
3. **Backend:** Configurar Cloudinary en backend (si no existe)
4. **Backend:** Servicio EXIF con `exifr` y geo-verificación Haversine
5. **Backend:** Crear `EvidenciaModule` con controller + service + DTOs
6. **Backend:** Agregar campo `evidencia` en respuesta de planilla
7. **Backend:** Modificar `aprobarTodos` con validación de evidencias
8. **Backend:** Actualizar seed con rol supervisor
9. **Frontend:** Columna evidencia en CAOGrid con indicador visual
10. **Frontend:** Modal PanelEvidencias con grid de fotos
11. **Frontend:** Formulario UploadEvidencia con GPS y preview
12. **Frontend:** Panel General de Evidencias en cabecera de planilla
