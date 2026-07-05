-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoEvidencia" AS ENUM ('PENDIENTE', 'VERIFICADO', 'SOSPECHOSO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "CategoriaEvidencia" AS ENUM ('VISTA_GENERAL', 'DETALLE_CONSTRUCCION', 'MATERIAL', 'EQUIPO', 'PERSONAL', 'ANTES', 'DESPUES');

-- CreateEnum
CREATE TYPE "Jefatura" AS ENUM ('DI', 'JE', 'JT', 'JUPRE', 'JUS');

-- CreateEnum
CREATE TYPE "TipoPlanilla" AS ENUM ('BASE', 'CAO');

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "contratoNro" TEXT NOT NULL,
    "montoContrato" DOUBLE PRECISION NOT NULL,
    "anticipoPct" DOUBLE PRECISION NOT NULL DEFAULT 13.7747448,
    "anticipoMonto" DOUBLE PRECISION,
    "ordenProceder" TIMESTAMP(3) NOT NULL,
    "fechaConclusion" TIMESTAMP(3) NOT NULL,
    "suspendidoDias" INTEGER NOT NULL DEFAULT 0,
    "direccion" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "provincia" TEXT,
    "municipio" TEXT,
    "contratista" TEXT NOT NULL,
    "supervisor" TEXT NOT NULL,
    "fiscal" TEXT NOT NULL,
    "jefatura" "Jefatura" NOT NULL DEFAULT 'DI',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubroCatalogo" (
    "id" SERIAL NOT NULL,
    "jefatura" "Jefatura" NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "RubroCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCatalogo" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "rubroCatalogoId" INTEGER NOT NULL,

    CONSTRAINT "ItemCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rubro" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "proyectoId" INTEGER NOT NULL,

    CONSTRAINT "Rubro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "cantidadContrato" DOUBLE PRECISION NOT NULL,
    "montoOriginal" DOUBLE PRECISION NOT NULL,
    "rubroId" INTEGER NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanillaCAO" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoPlanilla" NOT NULL DEFAULT 'CAO',
    "numero" INTEGER NOT NULL,
    "periodo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "proyectoId" INTEGER NOT NULL,
    "planillaBaseId" INTEGER,

    CONSTRAINT "PlanillaCAO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'consulta',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenciaFotografica" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "exifLatitud" DOUBLE PRECISION,
    "exifLongitud" DOUBLE PRECISION,
    "exifAltitud" DOUBLE PRECISION,
    "exifFechaCaptura" TIMESTAMP(3),
    "exifDispositivo" TEXT,
    "exifModeloCamara" TEXT,
    "exifTieneGPS" BOOLEAN NOT NULL DEFAULT false,
    "verificacionEstado" "EstadoEvidencia" NOT NULL DEFAULT 'PENDIENTE',
    "verificacionDistancia" DOUBLE PRECISION,
    "verificacionRadio" INTEGER NOT NULL DEFAULT 500,
    "verificacionFuente" TEXT,
    "verificacionObservaciones" TEXT,
    "categoria" "CategoriaEvidencia" NOT NULL DEFAULT 'VISTA_GENERAL',
    "descripcion" TEXT,
    "avanceItemId" INTEGER NOT NULL,
    "planillaId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenciaFotografica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvanceItem" (
    "id" SERIAL NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "avancePct" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "unidad" TEXT,
    "precioUnitario" DOUBLE PRECISION,
    "cantidadContrato" DOUBLE PRECISION,
    "rubroCodigo" TEXT,
    "rubroNombre" TEXT,
    "aprobado" BOOLEAN,
    "itemId" INTEGER,
    "planillaId" INTEGER NOT NULL,

    CONSTRAINT "AvanceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Multa" (
    "id" SERIAL NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "planillaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Multa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesembolsoProgramado" (
    "id" SERIAL NOT NULL,
    "mes" TEXT NOT NULL,
    "montoProgramado" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "proyectoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesembolsoProgramado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanillaCAO_planillaBaseId_numero_key" ON "PlanillaCAO"("planillaBaseId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "ItemCatalogo" ADD CONSTRAINT "ItemCatalogo_rubroCatalogoId_fkey" FOREIGN KEY ("rubroCatalogoId") REFERENCES "RubroCatalogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubro" ADD CONSTRAINT "Rubro_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "Rubro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanillaCAO" ADD CONSTRAINT "PlanillaCAO_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanillaCAO" ADD CONSTRAINT "PlanillaCAO_planillaBaseId_fkey" FOREIGN KEY ("planillaBaseId") REFERENCES "PlanillaCAO"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenciaFotografica" ADD CONSTRAINT "EvidenciaFotografica_avanceItemId_fkey" FOREIGN KEY ("avanceItemId") REFERENCES "AvanceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenciaFotografica" ADD CONSTRAINT "EvidenciaFotografica_planillaId_fkey" FOREIGN KEY ("planillaId") REFERENCES "PlanillaCAO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenciaFotografica" ADD CONSTRAINT "EvidenciaFotografica_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvanceItem" ADD CONSTRAINT "AvanceItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvanceItem" ADD CONSTRAINT "AvanceItem_planillaId_fkey" FOREIGN KEY ("planillaId") REFERENCES "PlanillaCAO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Multa" ADD CONSTRAINT "Multa_planillaId_fkey" FOREIGN KEY ("planillaId") REFERENCES "PlanillaCAO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesembolsoProgramado" ADD CONSTRAINT "DesembolsoProgramado_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

