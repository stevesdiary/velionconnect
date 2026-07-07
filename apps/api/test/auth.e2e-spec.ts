import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { PrismaService } from '../src/prisma/prisma.service';

import { createTestApp, extractCookies } from './e2e-utils';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  // Unique per run so repeated local runs don't collide.
  const email = `e2e-auth-${Date.now()}@example.com`;
  const password = 'sup3r-secret-pw';
  const fullName = 'E2E Tester';

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'e2e-auth-' } },
    });
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('rejects an invalid email with 400', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password, fullName })
        .expect(400);
    });

    it('rejects a too-short password with 400', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `e2e-auth-short-${Date.now()}@example.com`,
          password: 'short',
          fullName,
        })
        .expect(400);
    });

    it('rejects unknown fields with 400 (whitelist)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `e2e-auth-x-${Date.now()}@example.com`,
          password,
          fullName,
          role: 'ADMIN',
        })
        .expect(400);
    });

    it('registers a new user and sets auth cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password, fullName })
        .expect(201);

      const cookies = extractCookies(res).join(';');
      expect(cookies).toContain('access_token=');
      expect(cookies).toContain('refresh_token=');
      // Session cookies must not be readable by client-side JS.
      expect(cookies.toLowerCase()).toContain('httponly');
    });

    it('rejects a duplicate email with 409', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password, fullName })
        .expect(409);
    });
  });

  describe('POST /auth/login + GET /auth/me', () => {
    it('rejects wrong credentials with 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401);
    });

    it('logs in with valid credentials and returns the current user via cookie', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);

      const cookies = extractCookies(loginRes);
      expect(cookies.join(';')).toContain('access_token=');

      const meRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(meRes.body).toMatchObject({ email, fullName });
      expect(meRes.body).not.toHaveProperty('passwordHash');
    });
  });

  describe('GET /auth/me without authentication', () => {
    it('returns 401', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });
  });
});
