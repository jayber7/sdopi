import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';

const FIXTURE = path.join(__dirname, 'fixtures', 'test-evidence.jpg');
const API = 'http://localhost:3001/api';

async function loginAs(page: Page, role: 'operador' | 'admin') {
  const creds = role === 'operador'
    ? { email: 'operador@cao.com', password: 'operador123' }
    : { email: 'admin@cao.com', password: 'admin123' };
  await page.goto('/login');
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL('/');
}

const MOCK_FOTO = {
  id: 999,
  url: 'https://via.placeholder.com/400',
  publicId: 'test/public-id',
  exifLatitud: -17.9636,
  exifLongitud: -67.1042,
  exifAltitud: 3700,
  exifFechaCaptura: '2026-07-02T12:00:00.000Z',
  exifDispositivo: 'Test Camera',
  exifModeloCamara: 'Playwright',
  exifTieneGPS: true,
  verificacionEstado: 'VERIFICADO',
  verificacionDistancia: 50,
  verificacionRadio: 500,
  verificacionFuente: 'exif',
  categoria: 'VISTA_GENERAL',
  descripcion: 'Test evidence uploaded by Playwright',
  avanceItemId: 0,
  planillaId: 0,
  userId: 1,
  createdAt: new Date().toISOString(),
};

test.describe('Evidencia Fotográfica — CAO 6 Hospital Oruro', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'operador');
  });

  test('navigate to hospital project CAO 6 and see evidence stats', async ({ page }) => {
    await page.goto('/proyectos/17');
    await page.waitForSelector('text=CAO N°6');
    await expect(page.locator('h1')).toContainText('HOSPITAL');
    await expect(page.getByText(/0\/2 verificadas/)).toBeVisible();
  });

  test('open general evidence panel', async ({ page }) => {
    await page.goto('/proyectos/17');
    await page.waitForSelector('text=CAO N°6');

    await page.getByText(/Evidencias:/).click();
    await expect(page.getByText('Panel General de Evidencias')).toBeVisible();
    await page.locator('.dialog-header button').last().click();
  });

  test('open evidence panel modal', async ({ page }) => {
    await page.goto('/proyectos/17');
    await page.waitForSelector('text=CAO N°6');

    // Click first "+" evidencia button
    const evBtn = page.locator('button').filter({ hasText: /^\+$/ }).first();
    await evBtn.click();

    // Modal should show heading and upload form
    await expect(page.getByRole('heading', { name: /Evidencia Fotográfica/ })).toBeVisible();
    await expect(page.getByText('Agregar Foto')).toBeVisible();
    await expect(page.getByText('No hay evidencia fotográfica')).toBeVisible();

    // Close modal
    await page.locator('.dialog-header button').last().click();
  });

  test('upload photo evidence (mocked API)', async ({ page }) => {
    // Mock the upload endpoint
    await page.route(`${API}/planillas/**/fotos/**`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_FOTO, id: Date.now(), avanceItemId: 759 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/proyectos/17');
    await page.waitForSelector('text=CAO N°6');

    // Click first "+" evidencia button
    const evBtn = page.locator('button').filter({ hasText: /^\+$/ }).first();
    await evBtn.click();
    await expect(page.getByRole('heading', { name: /Evidencia Fotográfica/ })).toBeVisible();

    // Upload image
    await page.locator('input[type="file"]').setInputFiles(FIXTURE);

    // Wait for the photo card to appear with VERIFICADO badge
    await expect(page.getByText('VERIFICADO').first()).toBeVisible({ timeout: 15000 });

    // Verify the photo card shows details
    await expect(page.getByText('GPS:').first()).toBeVisible();
    await expect(page.getByText('Test Camera').first()).toBeVisible();
  });

  test('delete evidence after upload (mocked API)', async ({ page }) => {
    // Mock upload POST + DELETE endpoints
    await page.route(`${API}/planillas/**/fotos/**`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_FOTO, id: Date.now(), avanceItemId: 759 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(`${API}/evidencias/**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Evidencia eliminada' }) });
      } else {
        await route.continue();
      }
    });

    await page.goto('/proyectos/17');
    await page.waitForSelector('text=CAO N°6');

    // Open evidence panel
    const evBtn = page.locator('button').filter({ hasText: /^\+$/ }).first();
    await evBtn.click();
    await expect(page.getByRole('heading', { name: /Evidencia Fotográfica/ })).toBeVisible();

    // Upload
    await page.locator('input[type="file"]').setInputFiles(FIXTURE);
    await expect(page.getByText('VERIFICADO').first()).toBeVisible({ timeout: 15000 });

    // Click Eliminar
    await expect(page.getByText('Eliminar')).toBeVisible();
    page.once('dialog', d => d.accept());
    await page.getByText('Eliminar').click();

    // After delete, panel should show "No hay evidencia"
    await expect(page.getByText('No hay evidencia fotográfica')).toBeVisible({ timeout: 10000 });
  });
});
