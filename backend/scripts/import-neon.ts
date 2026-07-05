import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../export-data.json'), 'utf-8'));

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('BEGIN');

  try {
    const userIds = new Map<number, number>();
    const planillaIds = new Map<number, number>();

    // Users
    for (const u of data.users) {
      const r = await client.query(
        `INSERT INTO "User" (email, password, nombre, role, activo, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [u.email, u.password, u.nombre, u.role, u.activo, u.createdAt, u.updatedAt]
      );
      userIds.set(u.id, r.rows[0].id);
    }
    console.log(`Users: ${userIds.size}`);

    // RubroCatalogo
    for (const rc of data.rubroCatalogos) {
      const r = await client.query(`INSERT INTO "RubroCatalogo" (jefatura, nombre) VALUES ($1,$2) RETURNING id`, [rc.jefatura, rc.nombre]);
      for (const ic of rc.items) {
        await client.query(`INSERT INTO "ItemCatalogo" (numero, descripcion, unidad, "rubroCatalogoId") VALUES ($1,$2,$3,$4)`, [ic.numero, ic.descripcion, ic.unidad, r.rows[0].id]);
      }
    }
    console.log(`RubroCatalogos: ${data.rubroCatalogos.length}`);

    // Proyecto
    const p = data.proyecto;
    const rp = await client.query(
      `INSERT INTO "Proyecto" (nombre, "contratoNro", "montoContrato", "anticipoPct", "anticipoMonto", "ordenProceder", "fechaConclusion", "suspendidoDias", direccion, latitud, longitud, provincia, municipio, contratista, supervisor, fiscal, jefatura, activo, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id`,
      [p.nombre, p.contratoNro, p.montoContrato, p.anticipoPct, p.anticipoMonto, p.ordenProceder, p.fechaConclusion, p.suspendidoDias, p.direccion, p.latitud, p.longitud, p.provincia, p.municipio, p.contratista, p.supervisor, p.fiscal, p.jefatura, p.activo, p.createdAt, p.updatedAt]
    );
    const proyectoId = rp.rows[0].id;
    console.log(`Proyecto: ${p.nombre} (id: ${proyectoId})`);

    // Rubros + Items
    for (const r of p.rubros) {
      const rr = await client.query(`INSERT INTO "Rubro" (codigo, nombre, "proyectoId") VALUES ($1,$2,$3) RETURNING id`, [r.codigo, r.nombre, proyectoId]);
      for (const i of r.items) {
        await client.query(`INSERT INTO "Item" (numero, descripcion, unidad, "precioUnitario", "cantidadContrato", "montoOriginal", "rubroId") VALUES ($1,$2,$3,$4,$5,$6,$7)`, [i.numero, i.descripcion, i.unidad, i.precioUnitario, i.cantidadContrato, i.montoOriginal, rr.rows[0].id]);
      }
    }
    console.log(`Rubros: ${p.rubros.length}`);

    // Planillas
    for (const pl of p.planillas) {
      const rpl = await client.query(`INSERT INTO "PlanillaCAO" (tipo, numero, periodo, "fechaInicio", "fechaFin", estado, "proyectoId") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [pl.tipo, pl.numero, pl.periodo, pl.fechaInicio, pl.fechaFin, pl.estado, proyectoId]);
      planillaIds.set(pl.id, rpl.rows[0].id);
    }
    for (const pl of p.planillas) {
      if (pl.planillaBaseId !== null) {
        const newId = planillaIds.get(pl.planillaBaseId);
        if (newId) await client.query(`UPDATE "PlanillaCAO" SET "planillaBaseId"=$1 WHERE id=$2`, [newId, planillaIds.get(pl.id)]);
      }
    }
    console.log(`Planillas: ${planillaIds.size}`);

    // AvanceItems — batch INSERT
    const avData: any[][] = [];
    for (const pl of p.planillas) {
      const newPlanillaId = planillaIds.get(pl.id)!;
      for (const av of pl.avances) {
        avData.push([av.cantidad, av.monto, av.avancePct, av.descripcion, av.unidad, av.precioUnitario, av.cantidadContrato, av.rubroCodigo, av.rubroNombre, av.aprobado, newPlanillaId]);
      }
    }
    const cols = ['cantidad', 'monto', '"avancePct"', 'descripcion', 'unidad', '"precioUnitario"', '"cantidadContrato"', '"rubroCodigo"', '"rubroNombre"', 'aprobado', '"planillaId"'];
    for (let i = 0; i < avData.length; i += 50) {
      const batch = avData.slice(i, i + 50);
      const vals = batch.map((_, j) => {
        const base = j * cols.length + 1;
        return `(${cols.map((_, k) => `$${base + k}`).join(',')})`;
      }).join(',');
      const params = batch.flat();
      await client.query(`INSERT INTO "AvanceItem" (${cols.join(',')}) VALUES ${vals}`, params);
    }
    console.log(`AvanceItems: ${avData.length}`);

    await client.query('COMMIT');
    console.log('\nImportación completada exitosamente.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
