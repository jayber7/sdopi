import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body,
  ParseIntPipe, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EvidenciaService } from './evidencia.service';
import { UploadFotoDto, RechazarEvidenciaDto } from './dto/upload-foto.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class EvidenciaController {
  constructor(private service: EvidenciaService) {}

  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @Post('planillas/:planillaId/fotos/:avanceItemId')
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(
    @Param('planillaId', ParseIntPipe) planillaId: number,
    @Param('avanceItemId', ParseIntPipe) avanceItemId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFotoDto,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new Error('No se recibió ninguna imagen');
    return this.service.upload(planillaId, avanceItemId, file, dto, user.userId);
  }

  @Roles('admin', 'supervisor', 'operador', 'consulta')
  @Get('planillas/:planillaId/fotos')
  findByPlanilla(@Param('planillaId', ParseIntPipe) planillaId: number) {
    return this.service.findByPlanilla(planillaId);
  }

  @Roles('admin', 'supervisor', 'operador', 'consulta')
  @Get('planillas/:planillaId/fotos/stats')
  stats(@Param('planillaId', ParseIntPipe) planillaId: number) {
    return this.service.stats(planillaId);
  }

  @Roles('admin', 'supervisor', 'operador', 'consulta')
  @Get('evidencias/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor', 'operador')
  @Delete('evidencias/:id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor')
  @Patch('evidencias/:id/rechazar')
  rechazar(@Param('id', ParseIntPipe) id: number, @Body() dto: RechazarEvidenciaDto) {
    return this.service.rechazar(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('evidencias/:id/restaurar')
  restaurar(@Param('id', ParseIntPipe) id: number) {
    return this.service.restaurar(id);
  }
}
