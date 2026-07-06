# Guion de Presentación — MVP CAO Gestión SDOP

**Duración estimada:** 15-20 min
**Audiencia:** Secretaría de Obras Públicas (SDOP)
**Formato:** Demo en vivo navegando el sistema

---

## 1. Introducción (2 min)

> Este es el sistema de seguimiento físico-financiero de proyectos que reemplaza el proceso manual en Excel. Permite gestionar proyectos, certificados de avance de obra, evidencia fotográfica con verificación GPS, y reportes ejecutivos — todo en una plataforma web accesible desde cualquier lugar.

**Puntos clave:**
- Digitalización del proceso actual basado en `ANALISIS DE CAO ROSARIO DEL INGRE V4.xlsm`
- Acceso basado en roles: admin, operador, supervisor, consulta
- Desplegado en la nube (Vercel + Neon PostgreSQL)

---

## 2. Login y Mapa Interactivo (1 min)

> Naveguemos al sistema. Iniciamos sesión y llegamos al mapa departamental de Oruro.

- **Mostrar:** Login con credenciales
- **Mostrar:** Mapa de Oruro con marcadores de proyectos
- **Mencionar:** Municipios, provincias, y estado de cada proyecto (normal, observado, alerta, concluido)

---

## 3. Gestión de Proyectos (3 min)

> Veamos la lista de proyectos activos y cómo se crea uno nuevo.

- **Mostrar:** `/proyectos` — lista de proyectos activos con contratista, monto, rubros
- **Mostrar:** "Nuevo Proyecto" — modal con campos contractuales
- **Mostrar:** Mapa interactivo para seleccionar ubicación (lat/lng)
- **Mostrar:** Llenado asistido desde datos de Excel
- **Mostrar:** Detalle del proyecto (`/proyectos/[id]`) con pestañas General y Planillas
- **Mencionar:** Roles — admin/operador pueden crear/editar, consulta solo lectura

---

## 4. Planilla Base (3 min)

> Cada proyecto comienza con una Planilla Base que contiene los datos contractuales. Es la línea base contra la que se mide el avance.

- **Mostrar:** Pestaña Planillas → Planilla Base en estado borrador
- **Mostrar:** RubrosManager — editar rubros, agregar/quitar items del catálogo
- **Mostrar:** Enviar → Aprobación por admin (items individuales: aprobar/rechazar)
- **Mostrar:** Al aprobar la Base → se crea automáticamente el CAO N°1
- **Flujo:** `Borrador → Enviado → Aprobado`

---

## 5. CAOs — Certificados de Avance (3 min)

> Los CAOs son certificados mensuales. Cada uno hereda los items de la Base y se va acumulando.

- **Mostrar:** CAO N°1 — grilla con columnas: Según Contrato | Avance Anterior | Avance Presente | Avance Acumulado | % Periodo | % Fecha
- **Mostrar:** Editar cantidad ejecutada por item
- **Mostrar:** Cierre → Enviar → Aprobar → se genera automáticamente el CAO N°2
- **Mostrar:** Items extra permitidos por CAO
- **Mencionar:** Máximo 7 CAOs por proyecto, bloqueo de items tras guardar

---

## 6. Evidencia Fotográfica con GPS (3 min)

> Cada avance se respalda con fotos georreferenciadas. El sistema verifica automáticamente que la foto se tomó en la ubicación del proyecto.

- **Mostrar:** Panel de evidencia en la vista de planilla
- **Mostrar:** Subir foto → seleccionar categoría (Vista General, Detalle Construcción, Material, etc.)
- **Mostrar:** Extracción automática de EXIF + coordenadas GPS
- **Mostrar:** Estado: VERIFICADO (coincide) / SOSPECHOSO (no coincide) / RECHAZADO
- **Mostrar:** Validación de evidencia antes de aprobar CAO (admin puede forzar)

---

## 7. Reportes Ejecutivos (3 min)

> El sistema genera reportes automáticos con datos acumulados hasta cualquier CAO.

- **Mostrar:** `/reportes/[proyectoId]`
- **Analisis CAO:** Tabla financiera con ANTICIPO, deducciones, avance físico y financiero, detalle de 18 líneas
- **Planilla Detalle:** Desglose item por item con cantidades por CAO, acumulado, OT1
- **Curva de Avance:** Gráfico Recharts — programado vs ejecutado físico vs ejecutado financiero
- **PDF:** Descargar reporte por CAO con datos acumulativos
- **Filtro:** `?hastaCao=N` para ver hasta un CAO específico

---

## 8. Sistema de Multas y Memorándums (1 min)

> Cuando un CAO excede su fecha de cierre, el sistema calcula automáticamente multas.

- **Mostrar:** Panel de alertas por CAO vencido
- **Mostrar:** Multa calculada (8,000 Bs/día default)
- **Mostrar:** Generación de Memorándum PDF

---

## 9. Cierre y Próximos Pasos (1 min)

> Eso es el MVP. El sistema ya está en producción y listo para usar con datos reales.

**Logros del MVP:**
- Gestión de proyectos con ubicación geográfica
- Planilla Base + 7 CAOs acumulativos
- Evidencia fotográfica con verificación GPS
- Reportes ejecutivos (Análisis CAO, Detalle, Curva de Avance, PDF)
- Multas y memorándums automáticos
- Roles y permisos (admin, operador, supervisor, consulta)
- Mapa departamental interactivo

**Próximos pasos sugeridos:**
- Carga de proyectos reales (POA 2026)
- Capacitación a operadores
- Ajustes según retroalimentación del usuario

---

> ¿Preguntas?
