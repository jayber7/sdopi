import { Module } from '@nestjs/common';
import { PlanillasController } from './planillas.controller';
import { PlanillasService } from './planillas.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [NotificacionesModule],
  controllers: [PlanillasController],
  providers: [PlanillasService],
})
export class PlanillasModule {}
