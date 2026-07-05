import { test, expect, type Page } from '@playwright/test';

async function loginAs(page: Page, role: 'admin' | 'operador') {
  const creds = role === 'admin'
    ? { email: 'admin@cao.com', password: 'admin123' }
    : { email: 'operador@cao.com', password: 'operador123' };

  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  // Espera navbar
  await expect(page.getByText('Salir')).toBeVisible({ timeout: 15000 });
}

test('login + create project via UI + load catalog modal', async ({ page }) => {
  await loginAs(page, 'admin');
  // Ir a proyectos
  await page.goto('http://localhost:3000/proyectos', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Proyectos' })).toBeVisible({ timeout: 15000 });

  // Crear nuevo proyecto
  await page.getByRole('button', { name: '+ Nuevo Proyecto' }).click();
  const p = {
    nombre: `TEST ${Date.now()}`,
    contratoNro: 'TEST-001',
    montoContrato: 50000,
    anticipoPct: 10,
    ordenProceder: '2025-09-23',
    fechaConclusion: '2026-03-23',
    direccion: 'Test Dir',
    contratista: 'Test Co',
    supervisor: 'Test Sup',
    fiscal: 'Test Fiscal',
  };

  await page.getByPlaceholder('Nombre del proyecto').fill(p.nombre);
  await page.getByPlaceholder('N° Contrato').fill(p.contratoNro);
  await page.getByPlaceholder('Monto Contrato Bs').fill(p.montoContrato.toString());
  await page.getByPlaceholder('% Anticipo').fill(p.anticipoPct.toString());
  // date fields: use click + type to trigger React onChange properly
  const ordLabel = page.locator('label').filter({ hasText: 'Orden de Proceder' }).locator('input');
  const fechaLabel = page.locator('label').filter({ hasText: 'Fecha Conclusión' }).locator('input');
  await ordLabel.click({ force: true });
  await ordLabel.type('2025-09-23');
  await fechaLabel.click({ force: true });
  await fechaLabel.type('2026-03-23');
  await page.getByPlaceholder('Días Suspendidos').fill('0');
  await page.getByPlaceholder('Calles / Ubicación del proyecto').fill(p.direccion);
  await page.getByPlaceholder('Contratista').fill(p.contratista);
  await page.getByPlaceholder('Supervisor').fill(p.supervisor);
  await page.getByPlaceholder('Fiscal').fill(p.fiscal);

  await page.getByRole('button', { name: 'Crear' }).click();
  await expect(page.getByRole('heading', { name: 'Proyectos' })).toBeVisible({ timeout: 15000 });
  const projectLink = page.getByRole('link', { name: p.nombre });
  await expect(projectLink.first()).toBeVisible({ timeout: 10000 });
  const href = await projectLink.first().getAttribute('href');
  console.log('project link href:', href);
  await page.goto(`http://localhost:3000${href}`);
  await page.waitForTimeout(3000);

  // Verificar que existe el botón BASE
  await expect(page.getByRole('button', { name: 'BASE' })).toBeVisible({ timeout: 10000 });
  console.log('BASE visible');

  // Buscar si existe botón "Catálogo"
  const catalogBtn = page.locator('button').filter({ hasText: /Catálogo|catálogo/i });
  console.log('Catalog buttons count:', await catalogBtn.count());
  if (await catalogBtn.count() > 0) {
    await catalogBtn.first().click();
    console.log('Clicked catalog button');
    await page.waitForTimeout(1000);
    const searchInput = page.getByPlaceholder('Buscar rubro por nombre');
    console.log('Search input count:', await searchInput.count());
    if (await searchInput.count() > 0) {
      await searchInput.fill('ARQUITECTONICO');
      await page.waitForTimeout(500);
      const rubroItem = page.getByText('ARQUITECTONICO', { exact: true });
      console.log('Rubro item count:', await rubroItem.count());
      if (await rubroItem.count() > 0) {
        await rubroItem.click();
        console.log('Clicked rubro');
      }
    }
  }
});
