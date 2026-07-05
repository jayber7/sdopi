import serverless from 'serverless-http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

let cachedHandler: serverless.Handler;

export default async function handler(req: any, res: any) {
  if (!cachedHandler) {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    });
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    cachedHandler = serverless(app.getHttpAdapter().getInstance());
  }
  return cachedHandler(req, res);
}
