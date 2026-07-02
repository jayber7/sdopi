import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { PlanillasModule } from './planillas/planillas.module';
import { EvidenciaModule } from './evidencia/evidencia.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ProyectosModule, PlanillasModule, EvidenciaModule],
})
export class AppModule {}
