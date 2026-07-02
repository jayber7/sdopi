## 1. Modelo de datos

- [ ] 1.1 Agregar modelo `Multa` y campo `multaDiaria` en `schema.prisma`
- [ ] 1.2 Ejecutar `prisma db push` para migrar SQLite
- [ ] 1.3 Agregar `multas` al `include` de `PlanillasService` (opcional, según diseño)

## 2. Backend — Cálculo de retraso

- [ ] 2.1 Crear método `calcularRetraso(planilla)` en `PlanillasService` que calcule días y monto potencial
- [ ] 2.2 Integrar `retraso` en `findOne()` para CAOs
- [ ] 2.3 Agregar interfaz `RetrasoInfo` en types del backend

## 3. Backend — Multas CRUD

- [ ] 3.1 Crear `MultasController` con `POST /planillas/:id/multas`
- [ ] 3.2 Crear `GET /planillas/:id/multas` en el controller
- [ ] 3.3 Crear `PATCH /multas/:id` para cambiar estado
- [ ] 3.4 Implementar generación de `memorandumRef` correlativo (MEM-{nro}/{año})
- [ ] 3.5 Registrar `MultasController` en `planillas.module.ts` (o crear módulo separado)

## 4. Backend — PDF Memorandum

- [ ] 4.1 Instalar `pdfkit` y `@types/pdfkit`
- [ ] 4.2 Crear `MemorandumService` con método `generarPDF(multaId)`
- [ ] 4.3 Implementar endpoint `GET /multas/:id/memorandum` que retorna PDF
- [ ] 4.4 Diseñar layout del PDF: encabezado, datos proyecto/CAO, detalle multa, firmas

## 5. Frontend — Alerta en lista de proyectos

- [ ] 5.1 Modificar `GET /api/proyectos` o crear endpoint que incluya resumen de retrasos
- [ ] 5.2 Agregar columna/badge de retraso en la lista de proyectos
- [ ] 5.3 Mostrar días totales y monto acumulado por proyecto

## 6. Frontend — Alerta en detalle de CAO

- [ ] 6.1 Agregar bloque `RetrasoAlerta` en detalle de CAO
- [ ] 6.2 Mostrar días de retraso y monto potencial
- [ ] 6.3 Agregar botón "Generar Multa" que llama `POST /planillas/:id/multas`
- [ ] 6.4 Agregar botón "📄 Memorandum PDF" que descarga el PDF
- [ ] 6.5 Listar multas existentes del CAO con estado y acciones

## 7. Frontend — Editar multaDiaria en proyecto

- [ ] 7.1 Agregar campo `multaDiaria` en el modal de edición de proyecto
- [ ] 7.2 Incluir `multaDiaria` en el PATCH de proyecto

## 8. Tests y verificación

- [ ] 8.1 Verificar cálculo de retraso con fechas pasadas y futuras
- [ ] 8.2 Verificar creación de multa con correlativo correcto
- [ ] 8.3 Verificar generación de PDF (se descarga correctamente)
- [ ] 8.4 Verificar aprobación de CAO con multa pendiente (no bloquea)
- [ ] 8.5 Verificar alertas en UI se actualizan al refrescar planilla
