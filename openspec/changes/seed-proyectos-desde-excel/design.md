## Context

Base de datos PostgreSQL con Prisma ORM. El modelo Proyecto actual tiene campos obligatorios que no existen en los archivos Excel del GADOR. Se necesita extender el schema y crear un seed script que lea los xlsx.

## Goals / Non-Goals

**Goals:**
- Extender modelo Proyecto con campos del Excel (etapa, montos, financiamiento, observaciones)
- Hacer opcionales campos que no vienen en el Excel
- Crear seed script que procese ambos archivos xlsx
- Ejecutar migración + seed

**Non-Goals:**
- No se modifican rubros/items/planillas para los nuevos proyectos
- No se toca el proyecto existente "Rosario del Ingre"
- No se agregan campos calculados (avanceFisico, avanceFinanciero, numeroPlanillas)

## Decisions

- **Enum `EtapaProyecto`** con valores normalizados (mayúsculas, sin acentos, guiones bajos). Mapea exactamente los ~10 valores de "Situacion Actual" del Excel.
- **`xlsx` package** para leer Excel desde Node.js (liviano, sin dependencias pesadas como Python).
- **Seed independiente** (`prisma/seed-proyectos.ts`) — no modifica el seed principal. Se ejecuta aparte.
- **Campos nuevos todos opcionales** para no romper proyectos existentes.

## Risks / Trade-offs

- [xlsx grande] → el script procesa línea por línea, no carga todo en memoria.
- [Datos sucios en Excel] → el script normaliza: trim, convierte comas a puntos en números, maneja fechas null.
