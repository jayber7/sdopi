-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EtapaProyecto" ADD VALUE 'PREINVERSION';
ALTER TYPE "EtapaProyecto" ADD VALUE 'INVERSION';
ALTER TYPE "EtapaProyecto" ADD VALUE 'CAMBIO_PREINVERSION_A_INVERSION';
ALTER TYPE "EtapaProyecto" ADD VALUE 'INVERSION_PARA_LICITACION';
