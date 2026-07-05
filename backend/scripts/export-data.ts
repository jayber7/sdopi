import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
  const rubroCatalogos = await prisma.rubroCatalogo.findMany({
    orderBy: { id: 'asc' },
    include: { items: { orderBy: { id: 'asc' } } },
  });

  const proyecto = await prisma.proyecto.findUnique({
    where: { id: 9 },
    include: {
      rubros: {
        orderBy: { id: 'asc' },
        include: { items: { orderBy: { id: 'asc' } } },
      },
      planillas: {
        orderBy: { id: 'asc' },
        include: {
          avances: {
            orderBy: { id: 'asc' },
            include: { evidencias: { orderBy: { id: 'asc' } } },
          },
          multas: { orderBy: { id: 'asc' } },
        },
      },
      desembolsosProgramados: { orderBy: { id: 'asc' } },
    },
  });

  const data = { users, rubroCatalogos, proyecto };
  const outPath = path.resolve(__dirname, '../export-data.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Exportado a ${outPath}`);
  console.log(`  Users: ${users.length}`);
  console.log(`  RubroCatalogos: ${rubroCatalogos.length}`);
  console.log(`  Proyecto: ${proyecto?.nombre} (id:${proyecto?.id})`);
  console.log(`  Rubros: ${proyecto?.rubros.length}`);
  console.log(`  Planillas: ${proyecto?.planillas.length}`);
  console.log(`  DesembolsosProgramados: ${proyecto?.desembolsosProgramados.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
