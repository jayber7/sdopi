import { test, expect } from '@playwright/test';
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

test('debug create project modal', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@cao.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('Salir')).toBeVisible({ timeout: 15000 });

  await page.goto('/proyectos', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Proyectos' })).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: '+ Nuevo Proyecto' }).click();
  await page.waitForTimeout(1000);

  console.log('Checking inputs...');
  const placeholders = ['Nombre del proyecto', 'N° Contrato', 'Monto Contrato Bs'];
  for (const ph of placeholders) {
    const el = page.getByPlaceholder(ph);
    const count = await el.count();
    const visible = count > 0 ? await el.first().isVisible().catch(() => false) : false;
    console.log(`  placeholder "${ph}": count=${count}, visible=${visible}`);
  }

  // Try body snapshot
  const p = DATA.proyecto;
  const nombreInput = page.getByPlaceholder('Nombre del proyecto');
  console.log('Filling nombre...');
  await nombreInput.fill(p.nombre);
  console.log('OK');
});
