## 1. Modelos y migración

- [x] 1.1 Agregar campos `anticipoMonto` y `anticipoPct` al modelo Proyecto en schema.prisma
- [x] 1.2 Crear modelo `Multa` con campos: id, planillaId, monto, descripcion, fecha, createdAt
- [x] 1.3 Crear modelo `DesembolsoProgramado` con campos: id, proyectoId, mes, montoProgramado, descripcion, createdAt
- [x] 1.4 Ejecutar `prisma db push` para sincronizar la base de datos

## 2. Módulo `datos-complementarios` (backend)

- [x] 2.1 Generar módulo NestJS `datos-complementarios` con `nest g resource`
- [x] 2.2 Implementar CRUD de Multas (crear, listar por planilla, eliminar)
- [x] 2.3 Implementar CRUD de DesembolsosProgramados (crear, listar por proyecto con cálculo de ejecutado)
- [x] 2.4 Extender ProyectoService/Controller para incluir anticipoMonto y anticipoPct

## 3. Módulo `reportes` (backend)

- [x] 3.1 Generar módulo NestJS `reportes` con controller y service
- [x] 3.2 Implementar servicio `ReporteAnalisisCaoService` que consulta Prisma y genera el JSON del reporte ANALISIS
- [x] 3.3 Implementar servicio `ReportePlanillaDetalleService` que genera el JSON del reporte PLANILLAS
- [x] 3.4 Implementar endpoint GET `/api/reportes/analisis-cao/:proyectoId`
- [x] 3.5 Implementar endpoint GET `/api/reportes/planillas/:proyectoId`
- [x] 3.6 Agregar DTOs de respuesta para los reportes

## 4. Frontend: página de reportes

- [x] 4.1 Crear ruta `/reportes/[proyectoId]` en Next.js
- [x] 4.2 Componente `TablaFinanciera`: tabla de CAOs con columnas (N°, período, desembolso, descuento, líquido, saldo, avance físico %, avance financiero %)
- [x] 4.3 Componente `TablaDetalleItems`: tabla con items agrupados por rubro, columnas de cada CAO + acumulado
- [x] 4.4 Componente `CurvaAvance`: gráfico Recharts (3 líneas: programado, físico ejecutado, financiero ejecutado)
- [x] 4.5 Selector de reporte (ANALISIS / CERTIFICADO / PLANILLAS) y botón de impresión
- [x] 4.6 Estilos de impresión (usando `report-print` class)

### 4b. Certificado Financiero (nuevo)

- [x] 4b.1 Agregar `CertificadoResponse` al DTO con 18 líneas de desglose
- [x] 4b.2 Calcular certificado en `ReportesService.analisisCao` cuando `hastaCao` está presente
- [x] 4b.3 Incluir multas en el cálculo del certificado
- [x] 4b.4 Componente `CertificadoReport`: tabla con columnas Anterior / Presente / Acumulado a la fecha

## 5. Datos de prueba

- [x] 5.1 Crear seed data con proyecto, rubros, items, 7 CAOs con AvanceItems (borra proyecto anterior si existe el mismo nombre)
- [x] 5.2 Verificar que los reportes se generan correctamente contra los datos seed
- [ ] 5.3 Comparar resultados con el Excel de referencia
