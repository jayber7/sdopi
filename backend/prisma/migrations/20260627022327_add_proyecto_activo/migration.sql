-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Proyecto" (
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
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Proyecto" ("anticipoPct", "contratista", "contratoNro", "createdAt", "direccion", "fechaConclusion", "fiscal", "id", "jefatura", "montoContrato", "nombre", "ordenProceder", "secretaria", "supervisor", "suspendidoDias", "updatedAt") SELECT "anticipoPct", "contratista", "contratoNro", "createdAt", "direccion", "fechaConclusion", "fiscal", "id", "jefatura", "montoContrato", "nombre", "ordenProceder", "secretaria", "supervisor", "suspendidoDias", "updatedAt" FROM "Proyecto";
DROP TABLE "Proyecto";
ALTER TABLE "new_Proyecto" RENAME TO "Proyecto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
