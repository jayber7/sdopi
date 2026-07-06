import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const r = await prisma.avanceItem.updateMany({
    where: { planilla: { proyectoId: 1 } },
    data: { itemId: null, rubroCodigo: null, rubroNombre: null },
  });
  console.log('Reset', r.count, 'avances');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
