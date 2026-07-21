import { Controller, Get, Patch, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificacionesService } from './notificaciones.service';

@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private service: NotificacionesService) {}

  @Get()
  obtenerNoLeidas(@CurrentUser() user: { userId: number }) {
    return this.service.obtenerNoLeidas(user.userId);
  }

  @Patch(':id/leer')
  marcarLeida(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    return this.service.marcarLeida(id, user.userId);
  }

  @Patch('leer-todas')
  marcarTodasLeidas(@CurrentUser() user: { userId: number }) {
    return this.service.marcarTodasLeidas(user.userId);
  }
}
