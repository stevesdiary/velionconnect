import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { RedisIoAdapter } from '../src/gateways/redis-io.adapter';

const cookieParser = require('cookie-parser') as typeof import('cookie-parser');

/**
 * Boots the full Nest application the same way `main.ts` does (cookie parsing,
 * the global validation pipe, and the `api/v1` prefix), against whatever
 * DATABASE_URL / REDIS_URL the environment provides. Callers own the returned
 * app and must `await app.close()` in `afterAll`.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api/v1');

  // Listen on an ephemeral port rather than app.init(): the realtime gateway
  // attaches a Socket.IO Redis adapter in afterInit, which needs a real HTTP
  // server. supertest still targets app.getHttpServer() as usual.
  await app.listen(0);
  return app;
}

/** Extracts Set-Cookie values from a supertest response for replay. */
export function extractCookies(res: {
  headers: Record<string, unknown>;
}): string[] {
  const raw = res.headers['set-cookie'];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw as string];
}
