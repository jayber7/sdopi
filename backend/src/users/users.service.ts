import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, nombre: true, role: true, activo: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, nombre: true, role: true, activo: true, createdAt: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: { email: string; password: string; nombre: string; role: string }) {
    const hashed = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: { ...data, password: hashed },
      select: { id: true, email: true, nombre: true, role: true, activo: true, createdAt: true },
    });
  }

  async update(id: number, data: { email?: string; nombre?: string; role?: string; activo?: boolean }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, nombre: true, role: true, activo: true, createdAt: true },
    });
  }

  async deactivate(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { activo: false },
      select: { id: true, email: true, nombre: true, role: true, activo: true, createdAt: true },
    });
  }
}
