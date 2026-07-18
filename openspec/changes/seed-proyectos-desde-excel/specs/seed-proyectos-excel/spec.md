# Seed de Proyectos desde Excel

## Descripción
Script que lee los archivos xlsx del GADOR y crea registros de Proyecto con los campos mapeados.

## Input
- `Docs/PROYECTOS EN EJECUCION 2026.xlsx` — hoja `LISTADO PROYECTOS`
- `Docs/PROYECTOS EN EJECUCION POA 2026 - ENERGIA.xlsx` — hoja `LISTADO PROYECTOS`

## Output
Registros en tabla `Proyecto` con datos del Excel. El proyecto existente "Rosario del Ingre" no se modifica.

## Reglas
- Si un proyecto ya existe por nombre exacto, se salta (upsert por nombre)
- Campos numéricos: convertir coma decimal a punto
- Fechas: parsear datetime de Excel a ISO
- Etapa: mapear string del Excel al enum `EtapaProyecto`
