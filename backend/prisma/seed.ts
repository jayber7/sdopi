import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@cao.com' },
    update: {},
    create: {
      email: 'admin@cao.com',
      password: adminPassword,
      nombre: 'Administrador',
      role: 'admin',
    },
  });

  const supervisorPassword = await bcrypt.hash('supervisor123', 10);
  await prisma.user.upsert({
    where: { email: 'supervisor@cao.com' },
    update: {},
    create: {
      email: 'supervisor@cao.com',
      password: supervisorPassword,
      nombre: 'Supervisor',
      role: 'supervisor',
    },
  });

  await prisma.user.upsert({
    where: { email: 'operador@cao.com' },
    update: {},
    create: {
      email: 'operador@cao.com',
      password: await bcrypt.hash('operador123', 10),
      nombre: 'Operador',
      role: 'operador',
    },
  });

  // ── Catálogo de rubros DI ──
  const catalogoDI = [
    { nombre: 'MOVIMIENTO DE TIERRAS', items: [
      { numero: 1, descripcion: 'INSTALACION DE FAENAS', unidad: 'GLB' },
      { numero: 2, descripcion: 'LIMPIEZA, DESBOSQUE Y DESTRONQUE (CHACO)', unidad: 'HA' },
      { numero: 3, descripcion: 'EXCAVACION NO CLASIFICADA', unidad: 'M3' },
      { numero: 4, descripcion: 'RELLENO Y COMPACTADO CON MATERIAL DE CORTE', unidad: 'M3' },
      { numero: 5, descripcion: 'EXCAV. EN ROCA C/MAQUINARIA Y EXPLOSIVOS', unidad: 'M3' },
      { numero: 6, descripcion: 'PERFILADO Y COMPACTADO DE SUB RASANTE', unidad: 'M2' },
    ]},
    { nombre: 'PAVIMENTO (RIPIADO)', items: [
      { numero: 7, descripcion: 'SUMINISTRO Y TRANSPORTE DE AGREGADO P/RIPIO', unidad: 'M3' },
      { numero: 8, descripcion: 'RIPIADO', unidad: 'M3' },
      { numero: 9, descripcion: 'LIMPIEZA GENERAL RIPIADO', unidad: 'GLB' },
    ]},
    { nombre: 'DRENAJE - OBRAS DE ARTE - MUROS', items: [
      { numero: 10, descripcion: 'REPLANTEO (TOPOGRAFICO)', unidad: 'GLB' },
      { numero: 11, descripcion: 'EXCAVACION PARA ESTRUCTURAS', unidad: 'M3' },
      { numero: 12, descripcion: 'HORMIGON CICLOPEO CON 60% PIEDRA DESPLAZADORA', unidad: 'M3' },
      { numero: 13, descripcion: 'HORMIGON SIMPLE TIPO A', unidad: 'M3' },
      { numero: 14, descripcion: 'ACERO ESTRUCTURAL', unidad: 'KG' },
      { numero: 15, descripcion: 'RELLENO DE TIERRA CERNIDA', unidad: 'M3' },
      { numero: 16, descripcion: 'RELLENO Y COMPACTACION CON MATERIAL COMUN', unidad: 'M3' },
      { numero: 17, descripcion: 'EMPEDRADO PARA BADEN', unidad: 'M2' },
      { numero: 18, descripcion: 'ZAMPEADO DE PIEDRA CON EMBOQUILLADO', unidad: 'M2' },
      { numero: 19, descripcion: 'GAVIONES', unidad: 'M3' },
      { numero: 20, descripcion: 'MAMPOSTERIA DE PIEDRA (CUNETAS REVESTIDAS)', unidad: 'ML' },
      { numero: 21, descripcion: 'PROV. Y COLOC. DE TUBO ARMCO D=1000 mm', unidad: 'ML' },
      { numero: 22, descripcion: 'HORMIGON SIMPLE TIPO "E"', unidad: 'M3' },
      { numero: 23, descripcion: 'CONSTRUCCION ZANJAS DE CORONAMIENTO', unidad: 'ML' },
    ]},
    { nombre: 'PUENTE PRESFORZADO L=35 M PROG.15+220', items: [
      { numero: 24, descripcion: 'INSTALACION DE FAENAS', unidad: 'GLB' },
      { numero: 25, descripcion: 'REPLANTEO (TOPOGRAFICO)', unidad: 'GLB' },
      { numero: 26, descripcion: 'EXCAVACIONES PARA ESTRUCTURAS', unidad: 'M3' },
      { numero: 27, descripcion: 'HORMIGON SIMPLE TIPO A', unidad: 'M3' },
      { numero: 28, descripcion: 'ACERO ESTRUCTURAL', unidad: 'KG' },
      { numero: 29, descripcion: 'VIGA PRETENSADA FCK=350 KG/CM2', unidad: 'ML' },
      { numero: 30, descripcion: 'APARATO DE APOYO DE NEOPRENO', unidad: 'DM3' },
      { numero: 31, descripcion: 'LANZAMIENTO DE VIGA U OBRA FALSA', unidad: 'GLB' },
      { numero: 32, descripcion: 'JUNTAS DE DILATACION METALICAS', unidad: 'ML' },
      { numero: 33, descripcion: 'TUBO PVC DE DRENAJE D=4"', unidad: 'ML' },
      { numero: 34, descripcion: 'TRANSPORTE DE AGREGADOS P/VIGA DMT = 60 KM', unidad: 'M3' },
      { numero: 35, descripcion: 'HORMIGON SIMPLE TIPO "E"', unidad: 'M3' },
      { numero: 36, descripcion: 'COLCHONETA RENO', unidad: 'M3' },
      { numero: 37, descripcion: 'LIMPIEZA GENERAL', unidad: 'GLB' },
    ]},
    { nombre: 'PUENTE PRESFORZADO L=20 M PROG.25+475', items: [
      { numero: 38, descripcion: 'INSTALACION DE FAENAS', unidad: 'GLB' },
      { numero: 39, descripcion: 'REPLANTEO (TOPOGRAFICO)', unidad: 'GLB' },
      { numero: 40, descripcion: 'EXCAVACION PARA ESTRUCTURAS', unidad: 'M3' },
      { numero: 41, descripcion: 'HORMIGON CICLOPEO', unidad: 'M3' },
      { numero: 42, descripcion: 'HORMIGON SIMPLE TIPO A', unidad: 'M3' },
      { numero: 43, descripcion: 'ACERO ESTRUCTURAL', unidad: 'KG' },
      { numero: 44, descripcion: 'VIGA PRETENSADA FCK=350 KG/CM2', unidad: 'ML' },
      { numero: 45, descripcion: 'APARATO DE APOYO DE NEOPRENO', unidad: 'DM3' },
      { numero: 46, descripcion: 'LANZAMIENTO DE VIGA U OBRA FALSA', unidad: 'GLB' },
      { numero: 47, descripcion: 'JUNTAS DE DILATACION METALICAS', unidad: 'ML' },
      { numero: 48, descripcion: 'TUBO PVC DE DRENAJE D=4"', unidad: 'ML' },
      { numero: 49, descripcion: 'LIMPIEZA GENERAL', unidad: 'GLB' },
    ]},
    { nombre: 'RUBRO SEÑALIZACION Y SEGURIDAD VIAL', items: [
      { numero: 50, descripcion: 'SEÑALIZACION VERTICAL RESTRICTIVA', unidad: 'PZA' },
      { numero: 51, descripcion: 'SEÑALIZACION VERTICAL PREVENTIVA', unidad: 'PZA' },
      { numero: 52, descripcion: 'SEÑALIZACION VERTICAL INFORMATIVA', unidad: 'PZA' },
      { numero: 53, descripcion: 'MOJON POR KILOMETRO', unidad: 'PZA' },
      { numero: 54, descripcion: 'POSTES DE SEÑALIZACION', unidad: 'PZA' },
    ]},
    { nombre: 'MEDIDAS DE MITIGACION AMBIENTAL', items: [
      { numero: 65, descripcion: 'HUMECTACION DEL MATERIAL', unidad: 'KM' },
      { numero: 69, descripcion: 'TRANSPORTE DE RESIDUOS A BUZON', unidad: 'M3' },
      { numero: 70, descripcion: 'DISPOSICION DE DESHECHOS SOLIDOS DOMESTICOS', unidad: 'GLB' },
      { numero: 71, descripcion: 'RESTITUCION DE LAS CONDICIONES INICIALES (1000 M2)', unidad: 'M2' },
      { numero: 72, descripcion: 'REVEGETACION DE AREAS AFECTADAS (1000 M2)', unidad: 'M2' },
      { numero: 74, descripcion: 'PROVISION DE EXTINGUIDORES', unidad: 'GLB' },
    ]},
  ];

  for (const rc of catalogoDI) {
    await prisma.rubroCatalogo.create({
      data: {
        jefatura: 'DI',
        nombre: rc.nombre,
        items: { create: rc.items },
      },
    });
  }

  const proyecto = await prisma.proyecto.create({
    data: {
      nombre: 'MEJORAMIENTO CAMINO ROSARIO DEL INGRE - MACHICOCA',
      contratoNro: '005/2019',
      montoContrato: 16903840.54,
      anticipoPct: 13.7747448,
      ordenProceder: new Date('2019-10-21'),
      fechaConclusion: new Date('2022-01-09'),
      suspendidoDias: 211,
      direccion: 'C. Bolívar esq. Ayacucho N° 245',
      provincia: 'Cercado',
      municipio: 'Oruro',
      contratista: 'EMPRESA CONSTRUCTORA CHUQUISACA',
      supervisor: 'ECCORT',
      fiscal: 'ING. MANUEL TANUZ GONZALES',
      jefatura: 'DI',
    },
  });

  const rubros = await Promise.all([
    prisma.rubro.create({
      data: {
        codigo: 'M01',
        nombre: 'MOVIMIENTO DE TIERRAS',
        proyectoId: proyecto.id,
        items: {
          create: [
            { numero: 1, descripcion: 'INSTALACION DE FAENAS', unidad: 'GLB', precioUnitario: 47860.38, cantidadContrato: 0.5, montoOriginal: 23930.19 },
            { numero: 2, descripcion: 'LIMPIEZA, DESBOSQUE Y DESTRONQUE (CHACO)', unidad: 'HA', precioUnitario: 4767.61, cantidadContrato: 5.57, montoOriginal: 26555.59 },
            { numero: 3, descripcion: 'EXCAVACION NO CLASIFICADA', unidad: 'M3', precioUnitario: 15.64, cantidadContrato: 40377.64, montoOriginal: 631506.29 },
            { numero: 4, descripcion: 'RELLENO Y COMPACTADO CON MATERIAL DE CORTE', unidad: 'M3', precioUnitario: 18.52, cantidadContrato: 10580, montoOriginal: 195941.6 },
            { numero: 5, descripcion: 'EXCAV. EN ROCA C/MAQUINARIA Y EXPLOSIVOS', unidad: 'M3', precioUnitario: 57.61, cantidadContrato: 11436.25, montoOriginal: 658842.36 },
            { numero: 6, descripcion: 'PERFILADO Y COMPACTADO DE SUB RASANTE', unidad: 'M2', precioUnitario: 4.86, cantidadContrato: 40296, montoOriginal: 195838.56 },
          ],
        },
      },
    }),
    prisma.rubro.create({
      data: {
        codigo: 'M02',
        nombre: 'PAVIMENTO (RIPIADO)',
        proyectoId: proyecto.id,
        items: {
          create: [
            { numero: 7, descripcion: 'SUMINISTRO Y TRANSPORTE DE AGREGADO P/RIPIO', unidad: 'M3', precioUnitario: 61.39, cantidadContrato: 23213.09, montoOriginal: 1425051.6 },
            { numero: 8, descripcion: 'RIPIADO', unidad: 'M3', precioUnitario: 18.55, cantidadContrato: 24098.81, montoOriginal: 447032.93 },
            { numero: 9, descripcion: 'LIMPIEZA GENERAL RIPIADO', unidad: 'GLB', precioUnitario: 44453.32, cantidadContrato: 0.4, montoOriginal: 17781.33 },
          ],
        },
      },
    }),
    prisma.rubro.create({
      data: {
        codigo: 'M03',
        nombre: 'DRENAJE - OBRAS DE ARTE - MUROS',
        proyectoId: proyecto.id,
        items: {
          create: [
            { numero: 10, descripcion: 'REPLANTEO (TOPOGRAFICO)', unidad: 'GLB', precioUnitario: 3848.37, cantidadContrato: 0.2, montoOriginal: 769.67 },
            { numero: 11, descripcion: 'EXCAVACION PARA ESTRUCTURAS', unidad: 'M3', precioUnitario: 27.03, cantidadContrato: 7899.85, montoOriginal: 213532.95 },
            { numero: 12, descripcion: 'HORMIGON CICLOPEO CON 60% PIEDRA DESPLAZADORA', unidad: 'M3', precioUnitario: 652.63, cantidadContrato: 1522.75, montoOriginal: 993792.33 },
            { numero: 13, descripcion: 'HORMIGON SIMPLE TIPO A', unidad: 'M3', precioUnitario: 1801.53, cantidadContrato: 837.96, montoOriginal: 1509610.08 },
            { numero: 14, descripcion: 'ACERO ESTRUCTURAL', unidad: 'KG', precioUnitario: 15.35, cantidadContrato: 108768.82, montoOriginal: 1669601.39 },
            { numero: 15, descripcion: 'RELLENO DE TIERRA CERNIDA', unidad: 'M3', precioUnitario: 79.53, cantidadContrato: 74.01, montoOriginal: 5886.02 },
            { numero: 16, descripcion: 'RELLENO Y COMPACTACION CON MATERIAL COMUN', unidad: 'M3', precioUnitario: 59.3, cantidadContrato: 30077.59, montoOriginal: 1783601.09 },
            { numero: 17, descripcion: 'EMPEDRADO PARA BADEN', unidad: 'M2', precioUnitario: 213.4, cantidadContrato: 384.62, montoOriginal: 82077.91 },
            { numero: 18, descripcion: 'ZAMPEADO DE PIEDRA CON EMBOQUILLADO', unidad: 'M2', precioUnitario: 127.61, cantidadContrato: 795, montoOriginal: 101449.95 },
            { numero: 19, descripcion: 'GAVIONES', unidad: 'M3', precioUnitario: 474.36, cantidadContrato: 1717, montoOriginal: 814476.12 },
            { numero: 20, descripcion: 'MAMPOSTERIA DE PIEDRA (CUNETAS REVESTIDAS)', unidad: 'ML', precioUnitario: 111.72, cantidadContrato: 18000, montoOriginal: 2010960 },
            { numero: 21, descripcion: 'PROV. Y COLOC. DE TUBO ARMCO D=1000 mm', unidad: 'ML', precioUnitario: 1596.02, cantidadContrato: 343.55, montoOriginal: 548312.67 },
            { numero: 22, descripcion: 'HORMIGON SIMPLE TIPO "E"', unidad: 'M3', precioUnitario: 638.48, cantidadContrato: 70.82, montoOriginal: 45217.15 },
            { numero: 23, descripcion: 'CONSTRUCCION ZANJAS DE CORONAMIENTO', unidad: 'ML', precioUnitario: 44.35, cantidadContrato: 2726.08, montoOriginal: 120901.65 },
          ],
        },
      },
    }),
    prisma.rubro.create({
      data: {
        codigo: 'M04',
        nombre: 'PUENTE PRESFORZADO L=35 M PROG.15+220',
        proyectoId: proyecto.id,
        items: {
          create: [
            { numero: 24, descripcion: 'INSTALACION DE FAENAS', unidad: 'GLB', precioUnitario: 47860.38, cantidadContrato: 1, montoOriginal: 47860.38 },
            { numero: 25, descripcion: 'REPLANTEO (TOPOGRAFICO)', unidad: 'GLB', precioUnitario: 3848.37, cantidadContrato: 1, montoOriginal: 3848.37 },
            { numero: 26, descripcion: 'EXCAVACIONES PARA ESTRUCTURAS', unidad: 'M3', precioUnitario: 27.03, cantidadContrato: 797, montoOriginal: 21542.91 },
            { numero: 27, descripcion: 'HORMIGON SIMPLE TIPO A', unidad: 'M3', precioUnitario: 1801.53, cantidadContrato: 486.72, montoOriginal: 876840.68 },
            { numero: 28, descripcion: 'ACERO ESTRUCTURAL', unidad: 'KG', precioUnitario: 15.35, cantidadContrato: 31927.89, montoOriginal: 490093.11 },
            { numero: 29, descripcion: 'VIGA PRETENSADA FCK=350 KG/CM2', unidad: 'ML', precioUnitario: 3943.09, cantidadContrato: 105, montoOriginal: 414024.45 },
            { numero: 30, descripcion: 'APARATO DE APOYO DE NEOPRENO', unidad: 'DM3', precioUnitario: 403.4, cantidadContrato: 48, montoOriginal: 19363.2 },
            { numero: 31, descripcion: 'LANZAMIENTO DE VIGA U OBRA FALSA', unidad: 'GLB', precioUnitario: 45986.77, cantidadContrato: 0.65, montoOriginal: 29891.4 },
            { numero: 32, descripcion: 'JUNTAS DE DILATACION METALICAS', unidad: 'ML', precioUnitario: 825.66, cantidadContrato: 18.2, montoOriginal: 15027.01 },
            { numero: 33, descripcion: 'TUBO PVC DE DRENAJE D=4"', unidad: 'ML', precioUnitario: 83.48, cantidadContrato: 47.3, montoOriginal: 3948.6 },
            { numero: 34, descripcion: 'TRANSPORTE DE AGREGADOS P/VIGA DMT = 60 KM', unidad: 'M3', precioUnitario: 150.48, cantidadContrato: 106.76, montoOriginal: 16065.24 },
            { numero: 35, descripcion: 'HORMIGON SIMPLE TIPO "E"', unidad: 'M3', precioUnitario: 638.48, cantidadContrato: 20.6, montoOriginal: 13152.69 },
            { numero: 36, descripcion: 'COLCHONETA RENO', unidad: 'M3', precioUnitario: 573.79, cantidadContrato: 476, montoOriginal: 273124.04 },
            { numero: 37, descripcion: 'LIMPIEZA GENERAL', unidad: 'GLB', precioUnitario: 4553.86, cantidadContrato: 1, montoOriginal: 4553.86 },
          ],
        },
      },
    }),
    prisma.rubro.create({
      data: {
        codigo: 'M05',
        nombre: 'PUENTE PRESFORZADO L=20 M PROG.25+475',
        proyectoId: proyecto.id,
        items: {
          create: [
            { numero: 38, descripcion: 'INSTALACION DE FAENAS', unidad: 'GLB', precioUnitario: 47860.38, cantidadContrato: 1, montoOriginal: 47860.38 },
            { numero: 39, descripcion: 'REPLANTEO (TOPOGRAFICO)', unidad: 'GLB', precioUnitario: 3848.37, cantidadContrato: 1, montoOriginal: 3848.37 },
            { numero: 40, descripcion: 'EXCAVACION PARA ESTRUCTURAS', unidad: 'M3', precioUnitario: 27.03, cantidadContrato: 421.23, montoOriginal: 11385.85 },
            { numero: 41, descripcion: 'HORMIGON CICLOPEO', unidad: 'M3', precioUnitario: 651.46, cantidadContrato: 379.8, montoOriginal: 247424.51 },
            { numero: 42, descripcion: 'HORMIGON SIMPLE TIPO A', unidad: 'M3', precioUnitario: 1801.53, cantidadContrato: 95.41, montoOriginal: 171883.98 },
            { numero: 43, descripcion: 'ACERO ESTRUCTURAL', unidad: 'KG', precioUnitario: 15.35, cantidadContrato: 7046.94, montoOriginal: 108170.53 },
            { numero: 44, descripcion: 'VIGA PRETENSADA FCK=350 KG/CM2', unidad: 'ML', precioUnitario: 3139.57, cantidadContrato: 61.8, montoOriginal: 194025.43 },
            { numero: 45, descripcion: 'APARATO DE APOYO DE NEOPRENO', unidad: 'DM3', precioUnitario: 403.4, cantidadContrato: 26.25, montoOriginal: 10589.25 },
            { numero: 46, descripcion: 'LANZAMIENTO DE VIGA U OBRA FALSA', unidad: 'GLB', precioUnitario: 45986.77, cantidadContrato: 1, montoOriginal: 45986.77 },
            { numero: 47, descripcion: 'JUNTAS DE DILATACION METALICAS', unidad: 'ML', precioUnitario: 825.66, cantidadContrato: 14.6, montoOriginal: 12054.64 },
            { numero: 48, descripcion: 'TUBO PVC DE DRENAJE D=4"', unidad: 'ML', precioUnitario: 83.48, cantidadContrato: 38.8, montoOriginal: 3239.02 },
            { numero: 49, descripcion: 'LIMPIEZA GENERAL', unidad: 'GLB', precioUnitario: 4553.86, cantidadContrato: 1, montoOriginal: 4553.86 },
          ],
        },
      },
    }),
    prisma.rubro.create({
      data: {
        codigo: 'M06',
        nombre: 'RUBRO SEÑALIZACION Y SEGURIDAD VIAL',
        proyectoId: proyecto.id,
        items: {
          create: [
            { numero: 50, descripcion: 'SEÑALIZACION VERTICAL RESTRICTIVA', unidad: 'PZA', precioUnitario: 1145.2, cantidadContrato: 15, montoOriginal: 17178 },
            { numero: 51, descripcion: 'SEÑALIZACION VERTICAL PREVENTIVA', unidad: 'PZA', precioUnitario: 977.64, cantidadContrato: 33, montoOriginal: 32262.12 },
            { numero: 52, descripcion: 'SEÑALIZACION VERTICAL INFORMATIVA', unidad: 'PZA', precioUnitario: 1497.96, cantidadContrato: 1, montoOriginal: 1497.96 },
            { numero: 53, descripcion: 'MOJON POR KILOMETRO', unidad: 'PZA', precioUnitario: 276.64, cantidadContrato: 26, montoOriginal: 7192.64 },
            { numero: 54, descripcion: 'POSTES DE SEÑALIZACION', unidad: 'PZA', precioUnitario: 235.45, cantidadContrato: 98, montoOriginal: 23074.1 },
          ],
        },
      },
    }),
    prisma.rubro.create({
      data: {
        codigo: 'M07',
        nombre: 'MEDIDAS DE MITIGACION AMBIENTAL',
        proyectoId: proyecto.id,
        items: {
          create: [
            { numero: 65, descripcion: 'HUMECTACION DEL MATERIAL', unidad: 'KM', precioUnitario: 412.06, cantidadContrato: 10, montoOriginal: 4120.6 },
            { numero: 69, descripcion: 'TRANSPORTE DE RESIDUOS A BUZON', unidad: 'M3', precioUnitario: 337.66, cantidadContrato: 460.72, montoOriginal: 155566.72 },
            { numero: 70, descripcion: 'DISPOSICION DE DESHECHOS SOLIDOS DOMESTICOS', unidad: 'GLB', precioUnitario: 11160.89, cantidadContrato: 0.2, montoOriginal: 2232.18 },
            { numero: 71, descripcion: 'RESTITUCION DE LAS CONDICIONES INICIALES (1000 M2)', unidad: 'M2', precioUnitario: 3424.36, cantidadContrato: 5.57, montoOriginal: 19073.69 },
            { numero: 72, descripcion: 'REVEGETACION DE AREAS AFECTADAS (1000 M2)', unidad: 'M2', precioUnitario: 5452.74, cantidadContrato: 4.78, montoOriginal: 26064.1 },
            { numero: 74, descripcion: 'PROVISION DE EXTINGUIDORES', unidad: 'GLB', precioUnitario: 6376.18, cantidadContrato: 0.4, montoOriginal: 2550.47 },
          ],
        },
      },
    }),
  ]);

  const allItems = await prisma.item.findMany({
    where: { rubro: { proyectoId: proyecto.id } },
    orderBy: { numero: 'asc' },
  });

  // Create Planilla Base (aprobada, fija como referencia contractual)
  const basePlanilla = await prisma.planillaCAO.create({
    data: {
      tipo: 'BASE',
      numero: 0,
      periodo: 'PLANILLA BASE - DATOS DE CONTRATO',
      fechaInicio: new Date('2019-10-21'),
      fechaFin: new Date('2022-01-09'),
      estado: 'borrador',
      proyectoId: proyecto.id,
      avances: {
        create: allItems.map((i: any) => ({
          itemId: i.id,
          descripcion: i.descripcion,
          unidad: i.unidad,
          precioUnitario: i.precioUnitario,
          cantidadContrato: i.cantidadContrato,
          cantidad: 0,
          monto: 0,
          avancePct: 0,
          aprobado: true,
        })),
      },
    },
  });

  // Create CAOs linked to the Base
  const caosData = [
    { numero: 1, periodo: '21-OCT-19 AL 31-ENE-20', inicio: new Date('2019-10-21'), fin: new Date('2020-01-31'), estado: 'borrador' },
    { numero: 2, periodo: '01-FEB-20 AL 20-MAR-20', inicio: new Date('2020-02-01'), fin: new Date('2020-03-20'), estado: 'borrador' },
    { numero: 3, periodo: '21-MAR-20 AL 30-NOV-20', inicio: new Date('2020-03-21'), fin: new Date('2020-11-30'), estado: 'aprobado' },
    { numero: 4, periodo: '01-DIC-20 AL 31-MAR-21', inicio: new Date('2020-12-01'), fin: new Date('2021-03-31'), estado: 'aprobado' },
    { numero: 5, periodo: '01-ABR-21 AL 11-JUN-21', inicio: new Date('2021-04-01'), fin: new Date('2021-06-11'), estado: 'aprobado' },
    { numero: 6, periodo: '12-JUN-21 AL 07-AGO-21', inicio: new Date('2021-06-12'), fin: new Date('2021-08-07'), estado: 'aprobado' },
    { numero: 7, periodo: '08-AGO-21 AL 30-SEP-21', inicio: new Date('2021-08-08'), fin: new Date('2021-09-30'), estado: 'aprobado' },
  ];

  const caos = [];
  for (const cd of caosData) {
    const cao = await prisma.planillaCAO.create({
      data: {
        tipo: 'CAO',
        planillaBaseId: basePlanilla.id,
        numero: cd.numero,
        periodo: cd.periodo,
        fechaInicio: cd.inicio,
        fechaFin: cd.fin,
        estado: cd.estado,
        proyectoId: proyecto.id,
      },
    });
    caos.push(cao);
  }

  // Distribute quantities across CAOs
  const avancesData: { itemId: number; planillaId: number; cantidad: number; monto: number; avancePct: number }[] = [];
  for (const item of allItems) {
    let remaining = item.cantidadContrato;
    for (let ci = 0; ci < caos.length; ci++) {
      const isLast = ci === caos.length - 1;
      const pct = isLast ? 1 : 0.05 + (ci + 1) * (0.85 / caos.length) * (Math.random() * 0.3 + 0.85);
      const cant = isLast
        ? Math.round(remaining * 100) / 100
        : Math.round(Math.min(remaining * Math.min(pct, 0.95), remaining) * 100) / 100;
      if (cant <= 0) continue;
      remaining = Math.round((remaining - cant) * 100) / 100;
      const monto = Math.round(cant * item.precioUnitario * 100) / 100;
      const avancePct = Math.round((cant / item.cantidadContrato) * 10000) / 100;
      avancesData.push({ itemId: item.id, planillaId: caos[ci].id, cantidad: cant, monto, avancePct });
    }
  }

  await prisma.avanceItem.createMany({ data: avancesData });

  console.log('Seed completado exitosamente.');
  console.log(`  Proyecto: ${proyecto.nombre}`);
  console.log(`  Catálogo DI: ${catalogoDI.length} rubros`);
  console.log(`  Rubros del proyecto: ${rubros.length}`);
  console.log(`  Planilla Base: creada (id: ${basePlanilla.id})`);
  console.log(`  CAOs: ${caos.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
