import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { createTestApp } from './e2e-utils';

/**
 * The GET /webhooks/:platform endpoint is the Meta subscription handshake.
 * It must echo hub.challenge only when hub.mode=subscribe and the verify token
 * matches the configured one (META_WHATSAPP_VERIFY_TOKEN in the test env).
 */
describe('Webhook challenge (e2e)', () => {
  let app: INestApplication<App>;
  const VERIFY_TOKEN = 'test-verify-token';

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('echoes the challenge when the verify token matches', () => {
    return request(app.getHttpServer())
      .get('/api/v1/webhooks/instagram')
      .query({
        'hub.mode': 'subscribe',
        'hub.challenge': '1234567890',
        'hub.verify_token': VERIFY_TOKEN,
      })
      .expect(200)
      .expect('1234567890');
  });

  it('rejects a mismatched verify token with 403', () => {
    return request(app.getHttpServer())
      .get('/api/v1/webhooks/instagram')
      .query({
        'hub.mode': 'subscribe',
        'hub.challenge': '1234567890',
        'hub.verify_token': 'wrong-token',
      })
      .expect(403);
  });

  it('rejects a non-subscribe mode with 403', () => {
    return request(app.getHttpServer())
      .get('/api/v1/webhooks/instagram')
      .query({
        'hub.mode': 'unsubscribe',
        'hub.challenge': '1234567890',
        'hub.verify_token': VERIFY_TOKEN,
      })
      .expect(403);
  });
});
