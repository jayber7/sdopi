import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

let cachedHandler: any;

export async function handler(event: any, context: any, callback: any) {
  if (!cachedHandler) {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    });
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const serverless = require('serverless-http');
    cachedHandler = serverless(app.getHttpAdapter().getInstance());
  }
  return cachedHandler(event, context, callback);
}

if (!process.env.VERCEL) {
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    });
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(3001);
    console.log('Backend corriendo en http://localhost:3001');
  }
  bootstrap();
}
