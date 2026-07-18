import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

type CaoData = {
  proyecto: {
    nombre: string;
    contratoNro: string;
    montoContrato: number;
    ordenProceder: string;
    fechaConclusion: string;
    direccion: string;
    contratista: string;
    supervisor: string;
    fiscal: string;
    anticipoPct: number;
    latitud: number;
    longitud: number;
  };
  rubros: Array<{
    codigo: string;
    nombre: string;
    items: Array<{
      numero: number;
      descripcion: string;
      unidad: string;
      precioUnitario: number;
      cantidadContrato: number;
    }>;
  }>;
  caos: Record<string, Array<{ itemNumero: number; cantidad: number }>>;
};

const DATA: CaoData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'cao-data.json'), 'utf-8')
);

const CAO_NUMBERS = Object.keys(DATA.caos).map(Number).sort((a, b) => a - b);

async function loginAs(page: Page, role: 'admin' | 'operador') {
  const creds = role === 'admin'
    ? { email: 'admin@cao.com', password: 'admin123' }
    : { email: 'operador@cao.com', password: 'operador123' };
  await page.goto('/login');
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('Salir')).toBeVisible({ timeout: 15000 });
}

async function fillBaseItem(page: Page, rubroCodigo: string, itemNumero: number, pu: number, cc: number) {
  const puInput = page.locator(`tr[data-rubro-codigo="${rubroCodigo}"] [data-item-numero="${itemNumero}"][data-field="pu"]`);
  const ccInput = page.locator(`tr[data-rubro-codigo="${rubroCodigo}"] [data-item-numero="${itemNumero}"][data-field="cc"]`);
  if (await puInput.isVisible().catch(() => false)) {
    await puInput.fill(pu.toString());
    await ccInput.fill(cc.toString());
  }
}

const DOCS_DIR = path.join(__dirname, 'docs');

test.describe('CAO Full Flow — Rosario del Ingre', () => {
  test.setTimeout(600000);

  test('complete CAO approval cycle via UI', async ({ page }) => {
    page.on('dialog', d => { console.log('DIALOG:', d.type(), d.message().slice(0, 300)); d.accept().catch(() => d.dismiss()); });
    page.on('response', resp => {
      if (resp.url().includes('/api/') && !resp.ok()) {
        console.log('API ERROR:', resp.status(), resp.url());
      }
    });

    // ── Phase 1: Login and create project ──
    await test.step('Iniciamos sesión como administrador del sistema', async () => {
      await loginAs(page, 'admin');
    });

    let proyectoId: number;
    await test.step('Creamos un nuevo proyecto de obra pública con todos los datos contractuales', async () => {
      const { proyecto: p } = DATA;
      const projRes = await page.evaluate(async (data) => {
        const r = await fetch(`/api/proyectos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: data.nombre,
            contratoNro: data.contratoNro,
            montoContrato: data.montoContrato,
            anticipoPct: data.anticipoPct,
            ordenProceder: data.ordenProceder,
            fechaConclusion: data.fechaConclusion,
            suspendidoDias: 0,
            direccion: data.direccion,
            contratista: data.contratista,
            supervisor: data.supervisor,
            fiscal: data.fiscal,
            latitud: data.latitud,
            longitud: data.longitud,
            jefatura: 'DI',
          }),
          credentials: 'include',
        });
        return r.ok ? await r.json() : null;
      }, p);
      expect(projRes).toBeTruthy();
      proyectoId = projRes.id;
    });

    await test.step('Navegamos al detalle del proyecto recién creado', async () => {
      await page.goto(`/proyectos/${proyectoId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    });

    await test.step('Verificamos que la planilla base se haya creado automáticamente', async () => {
      await expect(page.getByRole('button', { name: 'BASE' })).toBeVisible({ timeout: 10000 });
    });

    // ── Phase 2: BASE — Import catalog items matching JSON data, then fill PU/CC ──
    await test.step('Importamos los ítems del catálogo de rubros al proyecto', async () => {
      await page.evaluate(async (args) => {
      const { proyectoId, rubroData } = args;
      const catRubros = await (await fetch(`/api/catalogo/rubros?jefatura=DI`, { credentials: 'include' })).json();
      const payload = [];
      for (const rd of rubroData) {
        const catRubro = catRubros.find((cr: any) => cr.nombre === rd.nombre);
        if (!catRubro) continue;
        const catItems = await (await fetch(`/api/catalogo/rubros/${catRubro.id}/items`, { credentials: 'include' })).json();
        const itemNumeros = new Set(rd.items.map((i: any) => i.numero));
        const matchingItems = catItems.filter((ci: any) => itemNumeros.has(ci.numero));
        if (matchingItems.length === 0) continue;
        payload.push({ rubroCatalogoId: catRubro.id, itemCatalogoIds: matchingItems.map((ci: any) => ci.id) });
      }
      await fetch(`/api/proyectos/${proyectoId}/importar-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rubros: payload }),
        credentials: 'include',
      });
    }, { proyectoId, rubroData: DATA.rubros });
      await page.waitForTimeout(1000);
    });

    await test.step('Recargamos la página para ver los ítems importados en la planilla base', async () => {
      await page.goto(`/proyectos/${proyectoId}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('button', { name: 'BASE' })).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(2000);
    });

    await test.step('Completamos los precios unitarios y cantidades contrato de cada ítem', async () => {
      for (const rubro of DATA.rubros) {
        for (const item of rubro.items) {
          await fillBaseItem(page, rubro.codigo, item.numero, item.precioUnitario, item.cantidadContrato);
        }
      }
    });

    await test.step('Enviamos la planilla base para aprobación', async () => {
      console.log('Click Enviar para Aprobación...');
      await page.getByRole('button', { name: 'Enviar para Aprobación' }).click();
      await page.waitForTimeout(1500);
    });

    await test.step('Aprobamos la planilla base para crear el primer certificado de avance de obra', async () => {
      console.log('Click Aprobar Todo...');
      await page.getByRole('button', { name: 'Aprobar Todo' }).click();
      await page.waitForTimeout(2000);
    });

    // ── Phase 3: Cycle through CAOs 1-7 ──
    for (const caoNum of CAO_NUMBERS) {
      const caoLabel = caoNum === 0 ? 'BASE' : `N°${caoNum}`;
      const caoItems = DATA.caos[String(caoNum)];

      await test.step(`Procesamos el certificado ${caoLabel}: ingresamos cantidades de avance`, async () => {
        await page.getByRole('button', { name: caoLabel }).click();
        await page.waitForTimeout(1000);

        for (const ci of caoItems) {
          await fillCaoItem(page, ci.itemNumero, ci.cantidad);
        }

        const saved = await page.evaluate(async (args) => {
          const { proyectoId, caoNum, caoItems } = args;
          const planillas = await (await fetch(`/api/planillas?proyectoId=${proyectoId}`, { credentials: 'include' })).json();
          const planilla = planillas.find((pl: any) => pl.numero === caoNum && pl.tipo === 'CAO');
          if (!planilla) return 0;
          const detail: any = await (await fetch(`/api/planillas/${planilla.id}`, { credentials: 'include' })).json();
          const payload = [];
          for (const ci of caoItems) {
            const av = detail.avances.find((a: any) => a.item?.numero === ci.itemNumero);
            if (av) payload.push({ avanceId: av.id, itemId: av.itemId, cantidad: ci.cantidad });
          }
          if (payload.length > 0) {
            await fetch(`/api/planillas/${planilla.id}/items`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: payload }),
              credentials: 'include',
            });
          }
          return payload.length;
        }, { proyectoId, caoNum, caoItems });
      });

      await test.step(`Aprobamos el certificado ${caoLabel} y generamos su PDF`, async () => {
        await page.getByRole('button', { name: 'Enviar para Aprobación' }).click();
        await page.waitForTimeout(1500);

        await page.getByRole('button', { name: 'Aprobar Todo' }).click();
        await page.waitForTimeout(2000);

        const planillaId = await getPlanillaId(page, proyectoId, caoNum);
        if (planillaId) {
          await generateCaoPdf(page, planillaId, caoNum);
        }
      });
    }

    await test.step('Verificamos que los reportes se hayan generado correctamente', async () => {
      await page.goto(`/reportes/${proyectoId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Reportes', { timeout: 10000 });
      await page.waitForTimeout(1000);

      await expect(page.getByRole('button', { name: 'Análisis CAO' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Certificado' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Detalle de Planillas' })).toBeVisible();
      await expect(page.locator('table')).toBeVisible({ timeout: 5000 });

      for (const caoNum of CAO_NUMBERS) {
        const pdfPath = path.join(DOCS_DIR, `cao-${caoNum}.pdf`);
        expect(fs.existsSync(pdfPath)).toBeTruthy();
        const stat = fs.statSync(pdfPath);
        expect(stat.size).toBeGreaterThan(1000);
      }
    });
  });
});

async function fillCaoItem(page: Page, itemNumero: number, cantidad: number) {
  const input = page.locator(`[data-item-numero="${itemNumero}"][data-field="cantidad"]`).first();
  if (await input.isVisible().catch(() => false)) {
    await input.fill(cantidad.toString());
  }
}

async function getPlanillaId(page: Page, proyectoId: number, caoNum: number): Promise<number | null> {
  return page.evaluate(async (args) => {
    const r = await fetch(`/api/planillas?proyectoId=${args.proyectoId}`, { credentials: 'include' });
    const planillas = await r.json();
    const p = planillas.find((pl: any) => pl.numero === args.caoNum && pl.tipo === 'CAO');
    return p ? p.id : null;
  }, { proyectoId, caoNum });
}

async function generateCaoPdf(page: Page, planillaId: number, caoNum: number) {
  const dataUrl: string = await page.evaluate(async (id) => {
    const r = await fetch(`/api/reportes/cao/${id}/pdf`, { credentials: 'include' });
    const blob = await r.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }, planillaId);

  const b64 = dataUrl.split(',')[1];
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  const outPath = path.join(DOCS_DIR, `cao-${caoNum}.pdf`);
  fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
}
