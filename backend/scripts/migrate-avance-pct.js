const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const avances = await prisma.avanceItem.findMany({ where: { cantidadContrato: { gt: 0 } } });
  let updated = 0;
  for (const a of avances) {
    const pct = (a.cantidad / a.cantidadContrato) * 100;
    await prisma.avanceItem.update({ where: { id: a.id }, data: { avancePct: pct } });
    updated++;
  }
  console.log(`Actualizados ${updated} avances`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
