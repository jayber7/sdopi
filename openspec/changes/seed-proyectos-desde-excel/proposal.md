## Why

El sistema actualmente solo tiene un proyecto sembrado ("Rosario del Ingre"). El GADOR gestiona 36+ proyectos en distintas etapas. Se necesita poblar la base con todos los proyectos del plan operativo 2026 para que el sistema sea útil como herramienta de seguimiento departamental.

## What Changes

- Agregar campos faltantes del Excel al modelo Proyecto (situacion/etapa, montos, financiamiento, observaciones)
- Hacer opcionales campos que no vienen en el Excel (contratoNro, direccion, supervisor, fiscal)
- Crear enum `EtapaProyecto` con los 10 valores del ciclo de vida del proyecto
- Script que lea ambos archivos xlsx y siembre los proyectos
- El proyecto "Rosario del Ingre" existente se conserva intacto

## Capabilities

### New Capabilities
- `seed-proyectos-excel`: Parsear archivos xlsx del GADOR y crear registros de proyectos
- `etapas-proyecto`: Ciclo de vida de proyectos con enum de etapas (SIN_EJECUCION → CONCLUIDO)

### Modified Capabilities
- (ninguna — solo se extiende el modelo, no cambian requisitos existentes)

## Impact

- `backend/prisma/schema.prisma`: nuevo enum + campos opcionales en Proyecto
- `backend/prisma/seed-proyectos.ts`: nuevo seed script
- `backend/package.json`: agregar dependencia `xlsx` para leer Excel
- BD: requiere migración para nuevos campos
