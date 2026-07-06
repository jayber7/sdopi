import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const proyectoId = parseInt(process.argv[2] || '1', 10);

  const items = await prisma.item.findMany({
    where: { rubro: { proyectoId } },
    include: { rubro: true },
    orderBy: { numero: 'asc' },
  });

  const planillas = await prisma.planillaCAO.findMany({
    where: { proyectoId },
    orderBy: { id: 'asc' },
    include: {
      avances: {
        where: { itemId: null, descripcion: { not: null } },
        orderBy: { id: 'asc' },
      },
    },
  });

  let fixed = 0;
  for (const planilla of planillas) {
    for (let i = 0; i < planilla.avances.length && i < items.length; i++) {
      const av = planilla.avances[i];
      const item = items[i];
      await prisma.avanceItem.update({
        where: { id: av.id },
        data: {
          itemId: item.id,
          rubroCodigo: item.rubro.codigo,
          rubroNombre: item.rubro.nombre,
        },
      });
      fixed++;
    }
  }

  console.log(`Fixed ${fixed} avance items across ${planillas.length} planillas for proyecto #${proyectoId}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
