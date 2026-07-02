import { Module } from '@nestjs/common';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';
import { CatalogController } from './catalog.controller';

@Module({
  controllers: [ProyectosController, CatalogController],
  providers: [ProyectosService],
})
export class ProyectosModule {}
