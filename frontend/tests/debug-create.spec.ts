import { test, expect } from '@playwright/test';

test('verify UI project creation works', async ({ page }) => {
  // Login
  console.log('1: goto login...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin@cao.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('Salir')).toBeVisible({ timeout: 15000 });
  console.log('2: logged in');

  // Navigate to proyectos
  await page.goto('http://localhost:3000/proyectos', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Proyectos' })).toBeVisible({ timeout: 15000 });
  console.log('3: at proyectos');

  // Click create
  await page.getByRole('button', { name: '+ Nuevo Proyecto' }).click();
  console.log('4: modal open');

  // Fill form
  const testName = 'TEST-PROJECT-' + Date.now();
  await page.getByPlaceholder('Nombre del proyecto').fill(testName);
  await page.getByPlaceholder('N° Contrato').fill('TEST-001');
  await page.getByPlaceholder('Monto Contrato Bs').fill('50000');
  await page.getByPlaceholder('% Anticipo').fill('10');

  // Dates - use fill with ISO format for HTML date input
  const ordenInput = page.locator('label').filter({ hasText: 'Orden de Proceder' }).locator('input');
  const fechaInput = page.locator('label').filter({ hasText: 'Fecha Conclusión' }).locator('input');
  await ordenInput.fill('2025-09-23');
  await fechaInput.fill('2026-03-23');
  console.log('5: dates filled');

  await page.getByPlaceholder('Días Suspendidos').fill('0');
  await page.getByPlaceholder('Calles / Ubicación del proyecto').fill('Test Dir');
  await page.getByPlaceholder('Contratista').fill('Test Co');
  await page.getByPlaceholder('Supervisor').fill('Test Sup');
  await page.getByPlaceholder('Fiscal').fill('Test Fiscal');
  console.log('6: form filled');

  // Check if provincia/municipio need to be filled (they might have required validation)

  // Click crear
  await page.getByRole('button', { name: 'Crear' }).click();
  await page.waitForTimeout(1000);
  console.log('7: clicked crear');

  // Wait for modal to close and project to appear
  await page.getByRole('heading', { name: 'Proyectos' }).waitFor({ state: 'visible', timeout: 15000 });
  console.log('8: heading visible');

  // Verify project was created
  const projectLink = page.getByRole('link', { name: testName });
  await projectLink.waitFor({ state: 'visible', timeout: 10000 });
  console.log('9: project link found');

  // Navigate to project
  const href = await projectLink.getAttribute('href');
  console.log('href:', href);
  await page.goto(`http://localhost:3000${href}`);
  await page.waitForTimeout(2000);
  console.log('10: navigated to project');

  // Verify BASE button visible
  await expect(page.getByRole('button', { name: 'BASE' })).toBeVisible({ timeout: 10000 });
  console.log('11: BASE visible - SUCCESS');
});
