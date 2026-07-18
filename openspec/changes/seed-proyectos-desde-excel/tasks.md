## 1. Schema Prisma

- [ ] 1.1 Agregar enum `EtapaProyecto` con los 10 valores
- [ ] 1.2 Agregar campos opcionales a Proyecto (situacion, estructuraFinanciamiento, montoEjecutado, presupuestoVigente, tiempoEjecucion, modificaciones, detalleObs)
- [ ] 1.3 Hacer opcionales contratoNro, direccion, supervisor, fiscal
- [ ] 1.4 Ejecutar `prisma migrate dev`

## 2. Seed Script

- [ ] 2.1 Instalar dependencia `xlsx`
- [ ] 2.2 Crear `prisma/seed-proyectos.ts` con parser de Excel
- [ ] 2.3 Ejecutar seed

## 3. Verificación

- [ ] 3.1 Verificar proyectos creados en BD
- [ ] 3.2 Verificar que "Rosario del Ingre" sigue intacto
