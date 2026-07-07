import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

const cookieParser = require('cookie-parser') as typeof import('cookie-parser');
import helmet from 'helmet';

import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger';
import { RedisIoAdapter } from './gateways/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env['CORS_ORIGINS']?.split(',') ?? [
      'http://localhost:3000',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  setupSwagger(app);

  const port = parseInt(process.env['PORT'] ?? '3001', 10);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
