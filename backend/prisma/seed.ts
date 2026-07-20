import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── RBAC: Permisos y Roles por defecto ──
const RESOURCES = ['proyectos', 'planillas', 'evidencias', 'usuarios', 'roles', 'permisos', 'reportes', 'catalogo', 'dashboard'];
const ACTIONS = ['read', 'create', 'update', 'delete'];
const EXTRA_ACTIONS: Record<string, string[]> = {
  planillas: ['aprobar'],
  evidencias: ['verificar'],
  reportes: ['generate'],
};

const ROLE_PERMISSIONS: Record<string, { resource: string; action: string }[]> = {
  admin: RESOURCES.flatMap(r => {
    const actions = [...ACTIONS, ...(EXTRA_ACTIONS[r] ?? [])];
    if (r === 'planillas') {
      const set = new Set(actions);
      set.delete('create'); set.delete('update');
      return [...set].map(a => ({ resource: r, action: a }));
    }
    return actions.map(a => ({ resource: r, action: a }));
  }),
  operador: [
    { resource: 'proyectos', action: 'read' },
    { resource: 'planillas', action: 'read' },
    { resource: 'planillas', action: 'create' },
    { resource: 'planillas', action: 'update' },
    { resource: 'evidencias', action: 'read' },
    { resource: 'evidencias', action: 'create' },
    { resource: 'evidencias', action: 'update' },
    { resource: 'reportes', action: 'read' },
    { resource: 'catalogo', action: 'read' },
    { resource: 'dashboard', action: 'read' },
  ],
  supervisor: [
    { resource: 'proyectos', action: 'read' },
    { resource: 'planillas', action: 'read' },
    { resource: 'planillas', action: 'aprobar' },
    { resource: 'evidencias', action: 'read' },
    { resource: 'evidencias', action: 'verificar' },
    { resource: 'reportes', action: 'read' },
    { resource: 'reportes', action: 'generate' },
    { resource: 'dashboard', action: 'read' },
  ],
  consulta: RESOURCES.flatMap(r => (r === 'roles' || r === 'permisos' ? [] : [{ resource: r, action: 'read' as const }])),
};

const PROYECTO_NOMBRE = 'MEJORAMIENTO CAMINO ROSARIO DEL INGRE - MACHICOCA';

const CATALOGO_DI = [
  { nombre: 'MOVIMIENTO DE TIERRAS', items: [
    { numero: 1, descripcion: 'REPLANTEO (TOPOGRAFICO)', unidad: 'GLB' },
    { numero: 2, descripcion: 'revoque', unidad: 'HA.' },
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
    { numero: 13, descripcion: 'HORMIGON SIMPLE  TIPO A', unidad: 'M3' },
    { numero: 14, descripcion: 'ACERO ESTRUCTURAL', unidad: 'KG' },
    { numero: 15, descripcion: 'RELLENO DE TIERRA CERNIDA', unidad: 'M3' },
    { numero: 16, descripcion: 'RELLENO Y COMPACTACION  CON MATERIAL COMUN', unidad: 'M3' },
    { numero: 17, descripcion: 'EMPEDRADO PARA BADEN', unidad: 'M2' },
    { numero: 18, descripcion: 'ZAMPEADO DE PIEDRA CON EMBOQUILLADO', unidad: 'M2' },
    { numero: 19, descripcion: 'GAVIONES', unidad: 'M3' },
    { numero: 20, descripcion: 'MAMPOSTERIA DE PIEDRA (CUNETAS REVESTIDAS)', unidad: 'ML' },
    { numero: 21, descripcion: 'PROV. Y COLOC. DE TUBO ARMCO D=1000 mm', unidad: 'ML' },
    { numero: 22, descripcion: 'HORMIGON SIMPLE TIPO "E"', unidad: 'M3' },
    { numero: 23, descripcion: 'CONSTRUCCION  ZANJAS DE CORONAMIENTO', unidad: 'ML' },
  ]},
  { nombre: 'PUENTE PRESFORZADO L=35 M PROG.15+220', items: [
    { numero: 24, descripcion: 'INSTALACION DE FAENAS', unidad: 'GLB' },
    { numero: 25, descripcion: 'REPLANTEO (TOPOGRAFICO)', unidad: 'GLB' },
    { numero: 26, descripcion: 'EXCAVACIONES PARA ESTRUCTURAS', unidad: 'M3' },
    { numero: 27, descripcion: 'HORMIGON SIMPLE  TIPO A', unidad: 'M3' },
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
    { numero: 42, descripcion: 'HORMIGON SIMPLE  TIPO A', unidad: 'M3' },
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
    { numero: 65, descripcion: 'HUMECTACION DEL MATERIAL', unidad: 'KM.' },
    { numero: 69, descripcion: 'TRANSPORTE DE RESIDUOS A BUZON', unidad: 'M3' },
    { numero: 70, descripcion: 'DISPOSICION DE DESHECHOS SOLIDOS DOMESTICOS', unidad: 'GLB' },
    { numero: 71, descripcion: 'RESTITUCION DE LAS CONDICIONES INICIALES (1000 M2)', unidad: 'M2' },
    { numero: 72, descripcion: 'REVEGETACION DE AREAS AFECTADAS (1000 M2)', unidad: 'M2' },
    { numero: 74, descripcion: 'PROVISION DE  EXTIGUINDORES', unidad: 'GLB' },
  ]},
];

interface ItemSeed {
  numero: number;
  descripcion: string;
  unidad: string;
  precioUnitario: number;
  cantidadContrato: number;
  montoOriginal: number;
}

interface RubroSeed {
  codigo: string;
  nombre: string;
  items: ItemSeed[];
}

const RUBROS_SEED: RubroSeed[] = [
  { codigo: 'M01', nombre: 'MOVIMIENTO DE TIERRAS', items: [
    { numero: 1, descripcion: 'INSTALACION DE FAENAS', unidad: 'GLB', precioUnitario: 47860.38, cantidadContrato: 0.5, montoOriginal: 23930.19 },
    { numero: 2, descripcion: 'LIMPIEZA, DESBOSQUE Y DESTRONQUE (CHACO)', unidad: 'HA', precioUnitario: 4767.61, cantidadContrato: 5.57, montoOriginal: 26555.59 },
    { numero: 3, descripcion: 'EXCAVACION NO CLASIFICADA', unidad: 'M3', precioUnitario: 15.64, cantidadContrato: 40377.64, montoOriginal: 631506.29 },
    { numero: 4, descripcion: 'RELLENO Y COMPACTADO CON MATERIAL DE CORTE', unidad: 'M3', precioUnitario: 18.52, cantidadContrato: 10580, montoOriginal: 195941.6 },
    { numero: 5, descripcion: 'EXCAV. EN ROCA C/MAQUINARIA Y EXPLOSIVOS', unidad: 'M3', precioUnitario: 57.61, cantidadContrato: 11436.25, montoOriginal: 658842.36 },
    { numero: 6, descripcion: 'PERFILADO Y COMPACTADO DE SUB RASANTE', unidad: 'M2', precioUnitario: 4.86, cantidadContrato: 40296, montoOriginal: 195838.56 },
  ]},
  { codigo: 'M02', nombre: 'PAVIMENTO (RIPIADO)', items: [
    { numero: 7, descripcion: 'SUMINISTRO Y TRANSPORTE DE AGREGADO P/RIPIO', unidad: 'M3', precioUnitario: 61.39, cantidadContrato: 23213.09, montoOriginal: 1425051.6 },
    { numero: 8, descripcion: 'RIPIADO', unidad: 'M3', precioUnitario: 18.55, cantidadContrato: 24098.81, montoOriginal: 447032.93 },
    { numero: 9, descripcion: 'LIMPIEZA GENERAL RIPIADO', unidad: 'GLB', precioUnitario: 44453.32, cantidadContrato: 0.4, montoOriginal: 17781.33 },
  ]},
  { codigo: 'M03', nombre: 'DRENAJE - OBRAS DE ARTE - MUROS', items: [
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
  ]},
  { codigo: 'M04', nombre: 'PUENTE PRESFORZADO L=35 M PROG.15+220', items: [
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
  ]},
  { codigo: 'M05', nombre: 'PUENTE PRESFORZADO L=20 M PROG.25+475', items: [
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
  ]},
  { codigo: 'M06', nombre: 'RUBRO SEÑALIZACION Y SEGURIDAD VIAL', items: [
    { numero: 50, descripcion: 'SEÑALIZACION VERTICAL RESTRICTIVA', unidad: 'PZA', precioUnitario: 1145.2, cantidadContrato: 15, montoOriginal: 17178 },
    { numero: 51, descripcion: 'SEÑALIZACION VERTICAL PREVENTIVA', unidad: 'PZA', precioUnitario: 977.64, cantidadContrato: 33, montoOriginal: 32262.12 },
    { numero: 52, descripcion: 'SEÑALIZACION VERTICAL INFORMATIVA', unidad: 'PZA', precioUnitario: 1497.96, cantidadContrato: 1, montoOriginal: 1497.96 },
    { numero: 53, descripcion: 'MOJON POR KILOMETRO', unidad: 'PZA', precioUnitario: 276.64, cantidadContrato: 26, montoOriginal: 7192.64 },
    { numero: 54, descripcion: 'POSTES DE SEÑALIZACION', unidad: 'PZA', precioUnitario: 235.45, cantidadContrato: 98, montoOriginal: 23074.1 },
  ]},
  { codigo: 'M07', nombre: 'MEDIDAS DE MITIGACION AMBIENTAL', items: [
    { numero: 65, descripcion: 'HUMECTACION DEL MATERIAL', unidad: 'KM', precioUnitario: 412.06, cantidadContrato: 10, montoOriginal: 4120.6 },
    { numero: 69, descripcion: 'TRANSPORTE DE RESIDUOS A BUZON', unidad: 'M3', precioUnitario: 337.66, cantidadContrato: 460.72, montoOriginal: 155566.72 },
    { numero: 70, descripcion: 'DISPOSICION DE DESHECHOS SOLIDOS DOMESTICOS', unidad: 'GLB', precioUnitario: 11160.89, cantidadContrato: 0.2, montoOriginal: 2232.18 },
    { numero: 71, descripcion: 'RESTITUCION DE LAS CONDICIONES INICIALES (1000 M2)', unidad: 'M2', precioUnitario: 3424.36, cantidadContrato: 5.57, montoOriginal: 19073.69 },
    { numero: 72, descripcion: 'REVEGETACION DE AREAS AFECTADAS (1000 M2)', unidad: 'M2', precioUnitario: 5452.74, cantidadContrato: 4.78, montoOriginal: 26064.1 },
    { numero: 74, descripcion: 'PROVISION DE EXTINGUIDORES', unidad: 'GLB', precioUnitario: 6376.18, cantidadContrato: 0.4, montoOriginal: 2550.47 },
  ]},
];

// Desembolsos target por CAO (del Excel de referencia)
const CAO_TARGETS = [
  1748294.44,
  1502233.73,
  1448724.65,
  1599748.48,
  1455077.35,
  1718133.80,
  1502233.73,
];

// Multas para CAO 2 y CAO 5
const MULTAS = [
  { caoNumero: 2, monto: 5000, descripcion: 'MULTA POR ATRASO EN ENTREGA DE INFORME', fecha: new Date('2020-03-21') },
  { caoNumero: 5, monto: 12000, descripcion: 'MULTA POR INCUMPLIMIENTO DE ESPECIFICACIONES', fecha: new Date('2021-05-15') },
];

async function main() {
  // ── RBAC: Permisos por defecto ──
  const permMap = new Map<string, number>();
  for (const resource of RESOURCES) {
    const actions = [...ACTIONS, ...(EXTRA_ACTIONS[resource] ?? [])];
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action },
      });
      permMap.set(`${resource}:${action}`, perm.id);
    }
  }
  console.log(`Seed: ${permMap.size} permisos creados`);

  // ── RBAC: Roles por defecto ──
  const roleMap = new Map<string, number>();
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: roleName === 'admin' ? 'Acceso total al sistema' : undefined },
      create: {
        name: roleName,
        description: roleName === 'admin' ? 'Acceso total al sistema'
          : roleName === 'operador' ? 'Operaciones CRUD en proyectos, planillas y evidencias'
          : roleName === 'supervisor' ? 'Supervisión, aprobación y verificación'
          : 'Solo lectura en todos los módulos',
      },
    });
    roleMap.set(roleName, role.id);

    for (const p of perms) {
      const permId = permMap.get(`${p.resource}:${p.action}`);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
          update: {},
          create: { roleId: role.id, permissionId: permId },
        });
      }
    }
  }
  console.log(`Seed: ${roleMap.size} roles creados`);

  // ── Usuarios por defecto (con roleId) ──
  const users = [
    { email: 'admin@cao.com', password: 'admin123', nombre: 'Administrador', roleName: 'admin' },
    { email: 'supervisor@cao.com', password: 'supervisor123', nombre: 'Supervisor', roleName: 'supervisor' },
    { email: 'operador@cao.com', password: 'operador123', nombre: 'Operador', roleName: 'operador' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { roleId: roleMap.get(u.roleName) },
      create: { email: u.email, password: await bcrypt.hash(u.password, 10), nombre: u.nombre, role: u.roleName, roleId: roleMap.get(u.roleName) },
    });
  }

  // ── Borrar proyecto existente ──
  const existing = await prisma.proyecto.findFirst({ where: { nombre: PROYECTO_NOMBRE } });
  if (existing) {
    console.log(`Eliminando proyecto existente: "${PROYECTO_NOMBRE}" (id: ${existing.id})`);
    await prisma.proyecto.delete({ where: { id: existing.id } });
  }

  // ── Catálogo DI ──
  for (const rc of CATALOGO_DI) {
    await prisma.rubroCatalogo.create({ data: { jefatura: 'DI', nombre: rc.nombre, items: { create: rc.items } } });
  }

  // ── Proyecto ──
  const proyecto = await prisma.proyecto.create({
    data: {
      nombre: PROYECTO_NOMBRE,
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

  // ── Rubros + Items ──
  const rubros = await Promise.all(
    RUBROS_SEED.map(r =>
      prisma.rubro.create({ data: { codigo: r.codigo, nombre: r.nombre, proyectoId: proyecto.id, items: { create: r.items } } })
    )
  );

  // ── Planilla Base ──
  const allItems = await prisma.item.findMany({ where: { rubro: { proyectoId: proyecto.id } }, orderBy: { numero: 'asc' } });
  const basePlanilla = await prisma.planillaCAO.create({
    data: {
      tipo: 'BASE', numero: 0, periodo: 'PLANILLA BASE - DATOS DE CONTRATO',
      fechaInicio: new Date('2019-10-21'), fechaFin: new Date('2022-01-09'), estado: 'aprobado',
      proyectoId: proyecto.id,
      avances: {
        create: allItems.map(i => ({
          itemId: i.id, descripcion: i.descripcion, unidad: i.unidad, precioUnitario: i.precioUnitario,
          cantidadContrato: i.cantidadContrato, cantidad: 0, monto: 0, avancePct: 0, aprobado: true,
        })),
      },
    },
  });

  // ── 7 CAOs ──
  const periodos = [
    { periodo: '21-OCT-19 AL 31-ENE-20', inicio: new Date('2019-10-21'), fin: new Date('2020-01-31'), estado: 'aprobado' },
    { periodo: '01-FEB-20 AL 20-MAR-20', inicio: new Date('2020-02-01'), fin: new Date('2020-03-20'), estado: 'aprobado' },
    { periodo: '21-MAR-20 AL 30-NOV-20', inicio: new Date('2020-03-21'), fin: new Date('2020-11-30'), estado: 'aprobado' },
    { periodo: '01-DIC-20 AL 31-MAR-21', inicio: new Date('2020-12-01'), fin: new Date('2021-03-31'), estado: 'aprobado' },
    { periodo: '01-ABR-21 AL 11-JUN-21', inicio: new Date('2021-04-01'), fin: new Date('2021-06-11'), estado: 'aprobado' },
    { periodo: '12-JUN-21 AL 07-AGO-21', inicio: new Date('2021-06-12'), fin: new Date('2021-08-07'), estado: 'aprobado' },
    { periodo: '08-AGO-21 AL 30-SEP-21', inicio: new Date('2021-08-08'), fin: new Date('2021-09-30'), estado: 'aprobado' },
  ];
  const caos: { id: number; numero: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const p = periodos[i];
    const cao = await prisma.planillaCAO.create({
      data: { tipo: 'CAO', planillaBaseId: basePlanilla.id, numero: i + 1, periodo: p.periodo, fechaInicio: p.inicio, fechaFin: p.fin, estado: p.estado, proyectoId: proyecto.id },
    });
    caos.push(cao);
  }

  // ── AvanceItems con distribución target ──
  const montoTotal = RUBROS_SEED.reduce((s, r) => s + r.items.reduce((s2, i) => s2 + i.montoOriginal, 0), 0);
  const avancesData: { itemId: number; planillaId: number; cantidad: number; monto: number; avancePct: number }[] = [];
  for (let ci = 0; ci < caos.length; ci++) {
    const cao = caos[ci];
    const targetPeriodo = CAO_TARGETS[ci];
    for (const item of allItems) {
      const pctDelTotal = item.montoOriginal / montoTotal;
      const monto = Math.round(targetPeriodo * pctDelTotal * 100) / 100;
      const cantidad = item.precioUnitario > 0 ? Math.round((monto / item.precioUnitario) * 100) / 100 : 0;
      const avancePct = item.cantidadContrato > 0
        ? Math.round((cantidad / item.cantidadContrato) * 10000) / 100
        : 0;
      if (monto <= 0) continue;
      avancesData.push({ itemId: item.id, planillaId: cao.id, cantidad, monto, avancePct });
    }
  }
  await prisma.avanceItem.createMany({ data: avancesData });

  // ── DesembolsosProgramados ──
  const dpMeses = [
    { mes: 'OCT-19', monto: 800000 },
    { mes: 'NOV-19', monto: 948294.44 },
    { mes: 'FEB-20', monto: 750000 },
    { mes: 'MAR-20', monto: 752233.73 },
    { mes: 'MAR-20', monto: 500000 },
    { mes: 'JUL-20', monto: 948724.65 },
    { mes: 'DIC-20', monto: 800000 },
    { mes: 'MAR-21', monto: 799748.48 },
    { mes: 'ABR-21', monto: 750000 },
    { mes: 'JUN-21', monto: 705077.35 },
    { mes: 'JUN-21', monto: 800000 },
    { mes: 'AGO-21', monto: 918133.80 },
    { mes: 'AGO-21', monto: 800000 },
    { mes: 'SEP-21', monto: 702233.73 },
  ];
  await prisma.desembolsoProgramado.createMany({
    data: dpMeses.map(d => ({ mes: d.mes, montoProgramado: d.monto, descripcion: 'Desembolso programado', proyectoId: proyecto.id })),
  });

  // ── Multas ──
  for (const m of MULTAS) {
    const cao = caos.find(c => c.numero === m.caoNumero)!;
    await prisma.multa.create({ data: { monto: m.monto, descripcion: m.descripcion, fecha: m.fecha, planillaId: cao.id } });
  }

  console.log('Seed completado exitosamente.');
  console.log(`  Proyecto: ${proyecto.nombre} (id: ${proyecto.id})`);
  console.log(`  Catálogo DI: ${CATALOGO_DI.length} rubros`);
  console.log(`  Rubros del proyecto: ${rubros.length}`);
  console.log(`  Planilla Base: creada (id: ${basePlanilla.id})`);
  console.log(`  CAOs: ${caos.length}`);
  console.log(`  Desembolsos Programados: ${dpMeses.length}`);
  console.log(`  Multas: ${MULTAS.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
