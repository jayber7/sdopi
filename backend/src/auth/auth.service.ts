import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.activo) throw new UnauthorizedException('Credenciales invalidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales invalidas');

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return { token, user: { id: user.id, email: user.email, nombre: user.nombre, role: user.role } };
  }

  async me(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async register(data: { email: string; password: string; nombre: string; role: string }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException('El email ya esta registrado');
    return this.usersService.create(data);
  }
}
