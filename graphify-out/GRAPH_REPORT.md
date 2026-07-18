# Graph Report - .  (2026-07-06)

## Corpus Check
- 181 files · ~293,566 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 681 nodes · 978 edges · 57 communities (34 shown, 23 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_NestJS App Module Structure|NestJS App Module Structure]]
- [[_COMMUNITY_Auth Controller & Login|Auth Controller & Login]]
- [[_COMMUNITY_MapaOruro Component|MapaOruro Component]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Admin Catalogo Page|Admin Catalogo Page]]
- [[_COMMUNITY_Cloudinary Upload|Cloudinary Upload]]
- [[_COMMUNITY_Planilla CAO Grid|Planilla CAO Grid]]
- [[_COMMUNITY_Business Concepts & Specs|Business Concepts & Specs]]
- [[_COMMUNITY_Planillas Controller|Planillas Controller]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_CAO PDF & Planilla Base|CAO PDF & Planilla Base]]
- [[_COMMUNITY_Core Domain Concepts|Core Domain Concepts]]
- [[_COMMUNITY_Datos Complementarios|Datos Complementarios]]
- [[_COMMUNITY_Report DTOs|Report DTOs]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Backend TSConfig|Backend TSConfig]]
- [[_COMMUNITY_Frontend TSConfig|Frontend TSConfig]]
- [[_COMMUNITY_Shared TSConfig Base|Shared TSConfig Base]]
- [[_COMMUNITY_CAO Test Data|CAO Test Data]]
- [[_COMMUNITY_Seed Data|Seed Data]]
- [[_COMMUNITY_CAO Test Document Data|CAO Test Document Data]]
- [[_COMMUNITY_CAO Acumulativo Design|CAO Acumulativo Design]]
- [[_COMMUNITY_Cloudinary + Evidencia|Cloudinary + Evidencia]]
- [[_COMMUNITY_MapPicker Component|MapPicker Component]]
- [[_COMMUNITY_Mapa Portal Home|Mapa Portal Home]]
- [[_COMMUNITY_Etapa Proyecto|Etapa Proyecto]]
- [[_COMMUNITY_Proyecto CRUD & Form|Proyecto CRUD & Form]]
- [[_COMMUNITY_Nest CLI Config|Nest CLI Config]]
- [[_COMMUNITY_Migration Script (avance)|Migration Script (avance)]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Evidencia Tests|Evidencia Tests]]
- [[_COMMUNITY_Export Data Script|Export Data Script]]
- [[_COMMUNITY_Fix Orphan Avances|Fix Orphan Avances]]
- [[_COMMUNITY_Import Neon Script|Import Neon Script]]
- [[_COMMUNITY_Reset Orphan Avances|Reset Orphan Avances]]
- [[_COMMUNITY_CAO Debug Tests|CAO Debug Tests]]
- [[_COMMUNITY_Evidencia Gaps Fix|Evidencia Gaps Fix]]
- [[_COMMUNITY_Playwright Screenshots|Playwright Screenshots]]
- [[_COMMUNITY_TS Build Config|TS Build Config]]
- [[_COMMUNITY_Vercel Config|Vercel Config]]
- [[_COMMUNITY_Auth Spec|Auth Spec]]
- [[_COMMUNITY_Next Config|Next Config]]
- [[_COMMUNITY_Evidencia Test Fixtures|Evidencia Test Fixtures]]
- [[_COMMUNITY_Reporte Planilla Detalle|Reporte Planilla Detalle]]
- [[_COMMUNITY_Rubros Empty State Bug|Rubros Empty State Bug]]
- [[_COMMUNITY_CAO Full Flow Test|CAO Full Flow Test]]
- [[_COMMUNITY_Manual Migrations|Manual Migrations]]
- [[_COMMUNITY_Planilla Grid Grouped|Planilla Grid Grouped]]
- [[_COMMUNITY_Reporte Analisis CAO|Reporte Analisis CAO]]
- [[_COMMUNITY_Sistema Multas Config|Sistema Multas Config]]
- [[_COMMUNITY_EstadoEvidencia Enum|EstadoEvidencia Enum]]

## God Nodes (most connected - your core abstractions)
1. `PlanillasService` - 20 edges
2. `PrismaService` - 19 edges
3. `CatalogController` - 19 edges
4. `PlanillasController` - 17 edges
5. `useAuth()` - 15 edges
6. `compilerOptions` - 14 edges
7. `UsersService` - 13 edges
8. `EvidenciaService` - 12 edges
9. `compilerOptions` - 12 edges
10. `compilerOptions` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Session: provincia/municipio form fields, ProjectList filter` --semantically_similar_to--> `Control de Acceso por Rol (admin/operador/consulta)`  [INFERRED] [semantically similar]
  session-ses_0f57.md → openspec/specs/proyecto/spec.md
- `Excel data extraction plan (PLANILLAS + CAO sheets)` --conceptually_related_to--> `Reporte de Despliegue – ANTICIPO totals, CurvaAvance cumulative`  [INFERRED]
  refinandotest.md → reportedespliegue.md
- `PDF generation per CAO via pdfkit` --calls--> `Generated CAO PDFs (cao-1.pdf through cao-6.pdf)`  [EXTRACTED]
  refinandotest.md → frontend/tests/docs/cao-1.pdf
- `CAO Gestión System` --references--> `SDOP (Secretaría de Obras Públicas)`  [EXTRACTED]
  README.md → docs/presentacion-mvp.md
- `Initial Prisma Schema (Proyecto, Rubro, Item, PlanillaCAO, AvanceItem)` --conceptually_related_to--> `Certificado de Avance de Obra (CAO)`  [EXTRACTED]
  openspec/changes/archive/2025-06-25-setup-proyecto/design.md → docs/presentacion-mvp.md

## Import Cycles
- 1-file cycle: `backend/src/config/cloudinary.ts -> backend/src/config/cloudinary.ts`

## Hyperedges (group relationships)
- **Technology Stack Components** — readme_nestjs, readme_prisma, readme_nextjs, readme_react, readme_typescript [EXTRACTED 1.00]
- **MVP Core Features** — docs_presentacion_mvp_cao, docs_presentacion_mvp_planilla_base, docs_presentacion_mvp_evidencia_gps, docs_presentacion_mvp_reportes, docs_presentacion_mvp_mapa, docs_presentacion_mvp_multas [EXTRACTED 1.00]
- **etapas-proyecto change components** — openspec_changes_etapas-proyecto_design_etapas_proyecto, openspec_changes_etapas-proyecto_proposal_etapa_lifecycle_cap, openspec_changes_etapas-proyecto_proposal_etapa_ui_cap, openspec_changes_etapas-proyecto_design_string_sobre_enum, openspec_changes_etapas-proyecto_design_etapa_proyecto_modelo [EXTRACTED 1.00]
- **fix-evidencia-gaps change components** — openspec_changes_fix-evidencia-gaps_proposal_cuatro_gaps, openspec_changes_fix-evidencia-gaps_proposal_evidencia_fotografica_mod, openspec_changes_fix-evidencia-gaps_specs_evidencia-fotografica_delta_tabla_roles [EXTRACTED 1.00]
- **planilla-base-y-caos change components** — openspec_changes_planilla-base-y-caos_design_planilla_base_concepto, openspec_changes_planilla-base-y-caos_design_tipo_columna, openspec_changes_planilla-base-y-caos_design_cao_acumulativo, openspec_changes_planilla-base-y-caos_proposal_planilla_base_cap, openspec_changes_planilla-base-y-caos_proposal_cao_acumulativo_cap, openspec_changes_planilla-base-y-caos_specs_cao-extra-items_spec_items_extra [EXTRACTED 1.00]
- **Sistema de Reportes de Análisis CAO** — concept_reporte_analisis, concept_reporte_planillas, concept_certificado_financiero, concept_curva_avance, concept_desembolso_programado, concept_anticipo_contractual [EXTRACTED 1.00]
- **Sistema de Multas por Retraso y Memorandum** — concept_multa_retraso, concept_memorandum_pdf, concept_alerta_retraso [EXTRACTED 1.00]
- **Sistema CAO con Planilla Base** — concept_planilla_base, concept_cao_acumulativo, concept_cao_extra_items, concept_flujo_aprobacion [EXTRACTED 1.00]
- **Planilla lifecycle: Base work items individual (Ok/X) approval then CAO auto-create on approval** — openspec_specs_planilla-base_spec_planilla_base_concept, openspec_specs_planilla-base_spec_aprobacion_individual_items, reportedespliegue_cao_auto_create_on_approval, openspec_specs_planillas_spec_planilla_grid_view [INFERRED 0.85]
- **Comparative CAO analysis: ANTICIPO row, cumulative CurvaAvance, financial certificate 18 lines** — openspec_specs_reporte-analisis-cao_spec_antici_po_fila, openspec_specs_reporte-analisis-cao_spec_curva_avance, openspec_specs_reporte-analisis-cao_spec_certificado_financiero_18_lineas, reportedespliegue_total_financiero_incluye_anticipo, reportedespliegue_curva_avance_acumulada_fix [INFERRED 0.85]
- **Design session trail: CAO duplicate fix, Base+CAO workflow, etapas lifecycle** — session-ses_0ebe_planilla_base_y_caos_workflow, session-ses_0ebe_etapas_proyecto_design, reportedespliegue_prisma_unique_constraint_cao_numbers, reportedespliegue_cao_auto_create_on_approval [INFERRED 0.85]
- **CAO 7 — Contrato de obra pública** — frontend_tests_docs_cao_7_pdf, contrato_005_2019, proyecto_camino_rosario_ingle_machicoca_ivoca, consorcio_rosario [EXTRACTED 1.00]
- **Playwright trace resource screenshots — all near-blank** — playwright_screenshot_4899_blank, playwright_screenshot_9538_blank, playwright_screenshot_9557_near_blank [INFERRED 0.95]
- **Evidence test uses red image as photographic evidence fixture** — frontend_tests_evidencias_spec_ts, frontend_tests_fixtures_test_evidence_fixture_jpg [EXTRACTED 1.00]

## Communities (57 total, 23 thin omitted)

### Community 0 - "NestJS App Module Structure"
Cohesion: 0.05
Nodes (12): AppModule, AuthModule, DatosComplementariosModule, bootstrap(), handler(), PlanillasModule, PrismaModule, PrismaService (+4 more)

### Community 1 - "Auth Controller & Login"
Cohesion: 0.09
Nodes (12): AuthController, AuthService, CurrentUser, Roles(), CreateUserDto, LoginDto, JwtAuthGuard, RolesGuard (+4 more)

### Community 2 - "MapaOruro Component"
Cohesion: 0.07
Nodes (30): Props, tileUrls, capasBase, Props, Props, Proyecto, Props, TerritoryPanel() (+22 more)

### Community 3 - "Backend Dependencies"
Cohesion: 0.04
Nodes (44): dependencies, bcryptjs, class-transformer, class-validator, cookie-parser, exifr, multer, @nestjs/common (+36 more)

### Community 4 - "Admin Catalogo Page"
Cohesion: 0.07
Nodes (28): AdminCatalogoPage(), CatalogoItem, CatalogoRubro, jefaturas, AuthContext, AuthContextType, AuthProvider(), useAuth() (+20 more)

### Community 5 - "Cloudinary Upload"
Cohesion: 0.10
Nodes (13): cloudinary, deleteFromCloudinary(), uploadToCloudinary(), RechazarEvidenciaDto, UploadFotoDto, EvidenciaController, EvidenciaModule, EvidenciaService (+5 more)

### Community 6 - "Planilla CAO Grid"
Cohesion: 0.08
Nodes (31): Avance, BaseGrid, BaseItem, CAOGrid(), EvidenciaInfo, fdate(), fmt(), groupAvances() (+23 more)

### Community 7 - "Business Concepts & Specs"
Cohesion: 0.09
Nodes (33): Alertas Visuales de Retraso en UI (badges, dashboard), Anticipo Contractual (anticipoMonto y anticipoPct), CAO Acumulativo (grid con Avance Anterior/Presente/Acumulado), Items Extra en CAO (creación sin itemId, vinculación al aprobar), Certificado Financiero (18 líneas de desglose), Curva de Avance Físico vs Financiero (programado vs ejecutado), Desembolso Programado (curva de inversión), Dominio CAO: Proyecto, Rubro, Item, PlanillaCAO, AvanceItem (+25 more)

### Community 9 - "Frontend Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, leaflet, next, react, react-dom, recharts, @types/leaflet, devDependencies (+16 more)

### Community 10 - "CAO PDF & Planilla Base"
Cohesion: 0.10
Nodes (24): Generated CAO PDFs (cao-1.pdf through cao-6.pdf), Aprobación Individual de Items (admin Ok/X), Planilla Base – Datos Según Contrato, Planilla Base Spec, Sincronización Base – Items (Refrescar Base), Planilla Grid View (grouped by rubro with subtotals), Planillas Spec (base layer), ANTICIPO synthetic row (numero=0) in financial table (+16 more)

### Community 11 - "Core Domain Concepts"
Cohesion: 0.10
Nodes (22): Certificado de Avance de Obra (CAO), Evidencia Fotográfica con GPS, Sistema de Multas y Memorándums, Planilla Base, Reportes Ejecutivos, User Role Model (admin, operador, supervisor, consulta), SDOP (Secretaría de Obras Públicas), Initial Prisma Schema (Proyecto, Rubro, Item, PlanillaCAO, AvanceItem) (+14 more)

### Community 12 - "Datos Complementarios"
Cohesion: 0.21
Nodes (5): DatosComplementariosController, DatosComplementariosService, CreateDesembolsoProgramadoDto, CreateMultaDto, QueryMultaDto

### Community 13 - "Report DTOs"
Cohesion: 0.17
Nodes (9): AnalisisCaoResponse, AnalisisCaoRow, CertificadoResponse, PlanillaDetalleResponse, PlanillaItemRow, PlanillaRubroGroup, ReportesController, ReportesModule (+1 more)

### Community 14 - "Dev Dependencies"
Cohesion: 0.11
Nodes (17): devDependencies, concurrently, prettier, typescript, name, private, scripts, build (+9 more)

### Community 15 - "Backend TSConfig"
Cohesion: 0.12
Nodes (16): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, module, moduleResolution (+8 more)

### Community 16 - "Frontend TSConfig"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, incremental, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 17 - "Shared TSConfig Base"
Cohesion: 0.15
Nodes (12): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, resolveJsonModule (+4 more)

### Community 18 - "CAO Test Data"
Cohesion: 0.20
Nodes (4): CAO_NUMBERS, CaoData, DATA, DOCS_DIR

### Community 19 - "Seed Data"
Cohesion: 0.25
Nodes (8): CAO_TARGETS, CATALOGO_DI, ItemSeed, main(), MULTAS, prisma, RUBROS_SEED, RubroSeed

### Community 20 - "CAO Test Document Data"
Cohesion: 0.29
Nodes (7): CONSORCIO ROSARIO (Contratista), Contrato N° 005/2019 — Bs 16,903,840.54, DIRECCION DE INFRAESTRUCTURA (Fiscalización), CAO 7 — Desembolsos: Bs 10,974,447.10, Saldo: Bs 5,929,393.44, Avance Financiero: 55.98%, CAO N°7 — Informe de Avance Acumulado, MEJORAMIENTO CAMINO ROSARIO DEL INGRE - MACHICOCA - IVOCA (FASE I), SUPERVISORA CAMINOS

### Community 21 - "CAO Acumulativo Design"
Cohesion: 0.29
Nodes (7): Modulo Planillas CAO CRUD, Cumulative CAO data computed by query, Planilla Base contractual reference, Decision: tipo column on PlanillaCAO, cao-acumulativo capability, planilla-base capability, Extra items in CAO without Base correspondence

### Community 22 - "Cloudinary + Evidencia"
Cohesion: 0.33
Nodes (6): Cloudinary Storage Integration, Evidencia Fotográfica Spec, EvidenciaFotografica Prisma Model, Geo-verificación Haversine, SKIP_EVIDENCE_CHECK env var for testing, Session: photo evidence module analysis and implementation

### Community 23 - "MapPicker Component"
Cohesion: 0.40
Nodes (5): Mapa Departamental Interactivo, Leaflet Map Library, Nominatim Geocoding API, Dynamic Import with SSR=false Pattern, MapPicker Component

### Community 25 - "Etapa Proyecto"
Cohesion: 0.40
Nodes (5): EtapaProyecto data model with history, Lifecycle stages for Proyecto, Decision: String over Prisma Enum for etapa, etapa-lifecycle capability, etapa-ui capability

### Community 26 - "Proyecto CRUD & Form"
Cohesion: 0.50
Nodes (5): Proyecto CRUD with soft delete, Proyecto Spec, Control de Acceso por Rol (admin/operador/consulta), Ubicación con Leaflet, provincia/municipio, Nominatim, Session: provincia/municipio form fields, ProjectList filter

### Community 27 - "Nest CLI Config"
Cohesion: 0.50
Nodes (3): collection, $schema, sourceRoot

### Community 36 - "Evidencia Gaps Fix"
Cohesion: 0.67
Nodes (3): Four gaps in evidencia fotografica, evidencia-fotografica modified capability, Corrected role access table for evidencia

### Community 37 - "Playwright Screenshots"
Cohesion: 0.67
Nodes (3): Playwright trace screenshot — blank white page (800×450), Playwright trace screenshot — blank white page (800×450), Playwright trace screenshot — near blank (800×450), tiny UI element 113×17px at top-left

## Knowledge Gaps
- **251 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `name`, `version` (+246 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Backend Dependencies` to `Cloudinary Upload`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `cloudinary` connect `Cloudinary Upload` to `Backend Dependencies`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `NestJS App Module Structure` to `Auth Controller & Login`, `Cloudinary Upload`, `Planillas Controller`, `Datos Complementarios`, `Report DTOs`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _260 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `NestJS App Module Structure` be split into smaller, more focused modules?**
  _Cohesion score 0.052525252525252523 - nodes in this community are weakly interconnected._
- **Should `Auth Controller & Login` be split into smaller, more focused modules?**
  _Cohesion score 0.08525506638714186 - nodes in this community are weakly interconnected._
- **Should `MapaOruro Component` be split into smaller, more focused modules?**
  _Cohesion score 0.06717687074829932 - nodes in this community are weakly interconnected._