-- CreateTable
CREATE TABLE "Proyecto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "contratoNro" TEXT NOT NULL,
    "montoContrato" REAL NOT NULL,
    "anticipoPct" REAL NOT NULL DEFAULT 13.7747448,
    "ordenProceder" DATETIME NOT NULL,
    "fechaConclusion" DATETIME NOT NULL,
    "suspendidoDias" INTEGER NOT NULL DEFAULT 0,
    "secretaria" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "contratista" TEXT NOT NULL,
    "supervisor" TEXT NOT NULL,
    "fiscal" TEXT NOT NULL,
    "jefatura" TEXT NOT NULL DEFAULT 'DI',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RubroCatalogo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jefatura" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ItemCatalogo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "rubroCatalogoId" INTEGER NOT NULL,
    CONSTRAINT "ItemCatalogo_rubroCatalogoId_fkey" FOREIGN KEY ("rubroCatalogoId") REFERENCES "RubroCatalogo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rubro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "proyectoId" INTEGER NOT NULL,
    CONSTRAINT "Rubro_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "cantidadContrato" REAL NOT NULL,
    "montoOriginal" REAL NOT NULL,
    "rubroId" INTEGER NOT NULL,
    CONSTRAINT "Item_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "Rubro" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanillaCAO" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL DEFAULT 'CAO',
    "numero" INTEGER NOT NULL,
    "periodo" TEXT NOT NULL,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "proyectoId" INTEGER NOT NULL,
    "planillaBaseId" INTEGER,
    CONSTRAINT "PlanillaCAO_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanillaCAO_planillaBaseId_fkey" FOREIGN KEY ("planillaBaseId") REFERENCES "PlanillaCAO" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'consulta',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AvanceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cantidad" REAL NOT NULL,
    "monto" REAL NOT NULL,
    "avancePct" REAL NOT NULL,
    "descripcion" TEXT,
    "unidad" TEXT,
    "precioUnitario" REAL,
    "cantidadContrato" REAL,
    "rubroCodigo" TEXT,
    "rubroNombre" TEXT,
    "aprobado" BOOLEAN,
    "itemId" INTEGER,
    "planillaId" INTEGER NOT NULL,
    CONSTRAINT "AvanceItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AvanceItem_planillaId_fkey" FOREIGN KEY ("planillaId") REFERENCES "PlanillaCAO" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RubroCatalogo_jefatura_codigo_key" ON "RubroCatalogo"("jefatura", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
