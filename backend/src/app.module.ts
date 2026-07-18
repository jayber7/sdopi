import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RbacModule } from './rbac/rbac.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { PlanillasModule } from './planillas/planillas.module';
import { EvidenciaModule } from './evidencia/evidencia.module';
import { DatosComplementariosModule } from './datos-complementarios/datos-complementarios.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, RbacModule, ProyectosModule, PlanillasModule, EvidenciaModule, DatosComplementariosModule, ReportesModule],
})
export class AppModule {}
