# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cao-full-flow.spec.ts >> CAO Full Flow — Rosario del Ingre >> complete CAO approval cycle via UI
- Location: tests/cao-full-flow.spec.ts:64:7

# Error details

```
Error: Channel closed
```

```
Error: page.fill: Target page, context or browser has been closed
Call log:
  - waiting for locator('input[type="email"]')

```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import * as path from 'path';
  3   | import * as fs from 'fs';
  4   | 
  5   | type CaoData = {
  6   |   proyecto: {
  7   |     nombre: string;
  8   |     contratoNro: string;
  9   |     montoContrato: number;
  10  |     ordenProceder: string;
  11  |     fechaConclusion: string;
  12  |     direccion: string;
  13  |     contratista: string;
  14  |     supervisor: string;
  15  |     fiscal: string;
  16  |     anticipoPct: number;
  17  |   };
  18  |   rubros: Array<{
  19  |     codigo: string;
  20  |     nombre: string;
  21  |     items: Array<{
  22  |       numero: number;
  23  |       descripcion: string;
  24  |       unidad: string;
  25  |       precioUnitario: number;
  26  |       cantidadContrato: number;
  27  |     }>;
  28  |   }>;
  29  |   caos: Record<string, Array<{ itemNumero: number; cantidad: number }>>;
  30  | };
  31  | 
  32  | const DATA: CaoData = JSON.parse(
  33  |   fs.readFileSync(path.join(__dirname, 'fixtures', 'cao-data.json'), 'utf-8')
  34  | );
  35  | 
  36  | const CAO_NUMBERS = Object.keys(DATA.caos).map(Number).sort((a, b) => a - b);
  37  | 
  38  | async function loginAs(page: Page, role: 'admin' | 'operador') {
  39  |   const creds = role === 'admin'
  40  |     ? { email: 'admin@cao.com', password: 'admin123' }
  41  |     : { email: 'operador@cao.com', password: 'operador123' };
  42  |   await page.goto('/login');
> 43  |   await page.fill('input[type="email"]', creds.email);
      |              ^ Error: page.fill: Target page, context or browser has been closed
  44  |   await page.fill('input[type="password"]', creds.password);
  45  |   await page.getByRole('button', { name: 'Ingresar' }).click();
  46  |   await expect(page.getByText('Salir')).toBeVisible({ timeout: 15000 });
  47  | }
  48  | 
  49  | async function fillBaseItem(page: Page, rubroCodigo: string, itemNumero: number, pu: number, cc: number) {
  50  |   const puInput = page.locator(`tr[data-rubro-codigo="${rubroCodigo}"] [data-item-numero="${itemNumero}"][data-field="pu"]`);
  51  |   const ccInput = page.locator(`tr[data-rubro-codigo="${rubroCodigo}"] [data-item-numero="${itemNumero}"][data-field="cc"]`);
  52  |   if (await puInput.isVisible().catch(() => false)) {
  53  |     await puInput.fill(pu.toString());
  54  |     await ccInput.fill(cc.toString());
  55  |   }
  56  | }
  57  | 
  58  | const API = 'http://localhost:3001/api';
  59  | const DOCS_DIR = path.join(__dirname, 'docs');
  60  | 
  61  | test.describe('CAO Full Flow — Rosario del Ingre', () => {
  62  |   test.setTimeout(600000);
  63  | 
  64  |   test('complete CAO approval cycle via UI', async ({ page }) => {
  65  |     page.on('dialog', d => { console.log('DIALOG:', d.type(), d.message().slice(0, 300)); d.accept().catch(() => d.dismiss()); });
  66  |     page.on('response', resp => {
  67  |       if (resp.url().includes('/api/') && !resp.ok()) {
  68  |         console.log('API ERROR:', resp.status(), resp.url());
  69  |       }
  70  |     });
  71  | 
  72  |     // ── Phase 1: Login and create project ──
  73  |     await loginAs(page, 'admin');
  74  | 
  75  |     const { proyecto: p } = DATA;
  76  |     const projRes = await page.evaluate(async (data) => {
  77  |       const API = 'http://localhost:3001/api';
  78  |       const r = await fetch(`${API}/proyectos`, {
  79  |         method: 'POST',
  80  |         headers: { 'Content-Type': 'application/json' },
  81  |         body: JSON.stringify({
  82  |           nombre: data.nombre,
  83  |           contratoNro: data.contratoNro,
  84  |           montoContrato: data.montoContrato,
  85  |           anticipoPct: data.anticipoPct,
  86  |           ordenProceder: data.ordenProceder,
  87  |           fechaConclusion: data.fechaConclusion,
  88  |           suspendidoDias: 0,
  89  |           direccion: data.direccion,
  90  |           contratista: data.contratista,
  91  |           supervisor: data.supervisor,
  92  |           fiscal: data.fiscal,
  93  |           jefatura: 'DI',
  94  |         }),
  95  |         credentials: 'include',
  96  |       });
  97  |       return r.ok ? await r.json() : null;
  98  |     }, p);
  99  |     expect(projRes).toBeTruthy();
  100 |     const proyectoId = projRes.id;
  101 |     console.log('Proyecto creado:', proyectoId);
  102 | 
  103 |     // Navigate to project detail
  104 |     await page.goto(`/proyectos/${proyectoId}`, { waitUntil: 'domcontentloaded' });
  105 |     await page.waitForTimeout(2000);
  106 | 
  107 |     // Verify BASE planilla was auto-created
  108 |     await expect(page.getByRole('button', { name: 'BASE' })).toBeVisible({ timeout: 10000 });
  109 | 
  110 |     // ── Phase 2: BASE — Import catalog items matching JSON data, then fill PU/CC ──
  111 |     await page.evaluate(async (args) => {
  112 |       const API = 'http://localhost:3001/api';
  113 |       const { proyectoId, rubroData } = args;
  114 |       const catRubros = await (await fetch(`${API}/catalogo/rubros?jefatura=DI`, { credentials: 'include' })).json();
  115 |       const payload = [];
  116 |       for (const rd of rubroData) {
  117 |         const catRubro = catRubros.find((cr: any) => cr.nombre === rd.nombre);
  118 |         if (!catRubro) continue;
  119 |         const catItems = await (await fetch(`${API}/catalogo/rubros/${catRubro.id}/items`, { credentials: 'include' })).json();
  120 |         const itemNumeros = new Set(rd.items.map((i: any) => i.numero));
  121 |         const matchingItems = catItems.filter((ci: any) => itemNumeros.has(ci.numero));
  122 |         if (matchingItems.length === 0) continue;
  123 |         payload.push({ rubroCatalogoId: catRubro.id, itemCatalogoIds: matchingItems.map((ci: any) => ci.id) });
  124 |       }
  125 |       await fetch(`${API}/proyectos/${proyectoId}/importar-items`, {
  126 |         method: 'POST',
  127 |         headers: { 'Content-Type': 'application/json' },
  128 |         body: JSON.stringify({ rubros: payload }),
  129 |         credentials: 'include',
  130 |       });
  131 |     }, { proyectoId, rubroData: DATA.rubros });
  132 |     await page.waitForTimeout(1000);
  133 | 
  134 |     // Reload page after import
  135 |     await page.goto(`/proyectos/${proyectoId}`, { waitUntil: 'domcontentloaded' });
  136 |     await expect(page.getByRole('button', { name: 'BASE' })).toBeVisible({ timeout: 10000 });
  137 |     await page.waitForTimeout(2000);
  138 | 
  139 |     // Fill PU and CC for each BASE item
  140 |     for (const rubro of DATA.rubros) {
  141 |       for (const item of rubro.items) {
  142 |         await fillBaseItem(page, rubro.codigo, item.numero, item.precioUnitario, item.cantidadContrato);
  143 |       }
```