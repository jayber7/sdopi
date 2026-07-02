## 1. Modelo de datos

- [ ] 1.1 Agregar campo `etapaActual` y modelo `EtapaProyecto` en `schema.prisma`
- [ ] 1.2 Ejecutar `prisma db push` para migrar SQLite
- [ ] 1.3 Definir constantes de etapas y función `puedeTransicionar()` en util compartido

## 2. Backend — CRUD de etapas

- [ ] 2.1 Agregar validación en `ProyectosService.update()` para transiciones de etapa
- [ ] 2.2 Implementar lógica de cierre/apertura de `EtapaProyecto` al transicionar
- [ ] 2.3 Incluir `etapas` (histórico) en el `include` de proyecto
- [ ] 2.4 Agregar endpoint `PATCH /proyectos/:id/etapa` o incluir `etapaActual` en el PATCH existente

## 3. Backend — Restricción de CAOs por etapa

- [ ] 3.1 Validar en `PlanillasService.create()` que `proyecto.etapaActual === 'ejecucion'` para tipo CAO
- [ ] 3.2 Devolver error claro si el proyecto no está en ejecución

## 4. Frontend — Selector de etapa en formulario

- [ ] 4.1 Agregar dropdown de etapa en formulario de crear/editar proyecto
- [ ] 4.2 Filtrar opciones según etapa actual (solo siguiente etapa disponible)
- [ ] 4.3 Incluir `etapaActual` en el body del POST/PATCH

## 5. Frontend — Visualización de etapa

- [ ] 5.1 Agregar badge de etapa en la lista de proyectos (`/proyectos`)
- [ ] 5.2 Agregar badge de etapa en la cabecera del detalle de proyecto
- [ ] 5.3 Ocultar botón "+ Nueva" planilla si proyecto no está en ejecución
- [ ] 5.4 Mostrar mensaje informativo sobre disponibilidad de CAOs según etapa

## 6. Tests y verificación

- [ ] 6.1 Verificar que proyecto nuevo tiene `etapaActual="estudio"`
- [ ] 6.2 Verificar transiciones válidas (estudio→inversión, inversión→ejecución, ejecución→concluido)
- [ ] 6.3 Verificar que no se puede retroceder ni saltar etapas
- [ ] 6.4 Verificar que CAOs solo se crean en etapa "ejecucion"
- [ ] 6.5 Verificar que BASE se crea en cualquier etapa
