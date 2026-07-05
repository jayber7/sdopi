import { Module } from '@nestjs/common';
import { DatosComplementariosController } from './datos-complementarios.controller';
import { DatosComplementariosService } from './datos-complementarios.service';

@Module({
  controllers: [DatosComplementariosController],
  providers: [DatosComplementariosService],
  exports: [DatosComplementariosService],
})
export class DatosComplementariosModule {}
