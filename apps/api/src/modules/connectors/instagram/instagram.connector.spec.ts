import * as crypto from 'crypto';

import { ConfigService } from '@nestjs/config';
import { Platform } from '@velion/types';

import { InstagramConnector } from './instagram.connector';

/**
 * Builds a ConfigService stub. By default appSecret is empty, which makes the
 * connector skip HMAC signature verification (useful for exercising the parsing
 * logic without computing signatures). Pass an appSecret to test verification.
 */
function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const values: Record<string, string> = {
    'meta.graphApiVersion': 'v19.0',
    'meta.appSecret': '',
    'meta.whatsappVerifyToken': 'verify-token-123',
    ...overrides,
  };
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('InstagramConnector', () => {
  describe('platform', () => {
    it('reports the INSTAGRAM platform', () => {
      const connector = new InstagramConnector(makeConfig());
      expect(connector.platform).toBe(Platform.INSTAGRAM);
    });
  });

  describe('verifyWebhookChallenge', () => {
    const connector = new InstagramConnector(makeConfig());

    it('echoes the challenge when the verify token matches', () => {
      expect(connector.verifyWebhookChallenge('chal', 'verify-token-123')).toBe(
        'chal',
      );
    });

    it('returns null when the verify token does not match', () => {
      expect(
        connector.verifyWebhookChallenge('chal', 'wrong-token'),
      ).toBeNull();
    });
  });

  describe('handleWebhook', () => {
    it('parses a direct message with a text and image attachment', async () => {
      const connector = new InstagramConnector(makeConfig());
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'IG_ACCOUNT',
            time: 1700000000,
            messaging: [
              {
                sender: { id: 'customer-1' },
                recipient: { id: 'me' },
                timestamp: 1700000000000,
                message: {
                  mid: 'mid-abc',
                  text: 'Hello there',
                  attachments: [
                    { type: 'image', payload: { url: 'https://cdn/img.jpg' } },
                  ],
                },
              },
            ],
          },
        ],
      };

      const events = await connector.handleWebhook(payload, '');

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'message',
        platformMessageId: 'mid-abc',
        platformSenderId: 'customer-1',
        text: 'Hello there',
        mediaUrls: ['https://cdn/img.jpg'],
      });
      expect(events[0]!.timestamp).toEqual(new Date(1700000000000));
    });

    it('parses a text-only message with no attachments', async () => {
      const connector = new InstagramConnector(makeConfig());
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'IG_ACCOUNT',
            messaging: [
              {
                sender: { id: 'customer-2' },
                recipient: { id: 'me' },
                timestamp: 1700000001000,
                message: { mid: 'mid-def', text: 'Just text' },
              },
            ],
          },
        ],
      };

      const events = await connector.handleWebhook(payload, '');

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ text: 'Just text', mediaUrls: [] });
    });

    it('emits a mention event for story mention changes', async () => {
      const connector = new InstagramConnector(makeConfig());
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'IG_ACCOUNT',
            changes: [{ field: 'mentions', value: { media_id: 'story-1' } }],
          },
        ],
      };

      const events = await connector.handleWebhook(payload, '');

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'mention',
        platformSenderId: 'IG_ACCOUNT',
        raw: { media_id: 'story-1' },
      });
    });

    it('ignores messaging entries without a message body', async () => {
      const connector = new InstagramConnector(makeConfig());
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'IG_ACCOUNT',
            messaging: [
              { sender: { id: 'x' }, recipient: { id: 'me' }, timestamp: 1 },
            ],
          },
        ],
      };

      expect(await connector.handleWebhook(payload, '')).toEqual([]);
    });

    it('returns an empty array when there are no entries', async () => {
      const connector = new InstagramConnector(makeConfig());
      expect(
        await connector.handleWebhook({ object: 'instagram' }, ''),
      ).toEqual([]);
    });

    it('accepts a valid HMAC signature when an app secret is configured', async () => {
      const appSecret = 'super-secret';
      const connector = new InstagramConnector(
        makeConfig({ 'meta.appSecret': appSecret }),
      );
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'IG_ACCOUNT',
            messaging: [
              {
                sender: { id: 'c' },
                recipient: { id: 'me' },
                timestamp: 1,
                message: { mid: 'm', text: 'hi' },
              },
            ],
          },
        ],
      };
      const signature = `sha256=${crypto
        .createHmac('sha256', appSecret)
        .update(JSON.stringify(payload))
        .digest('hex')}`;

      const events = await connector.handleWebhook(payload, signature);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ platformMessageId: 'm', text: 'hi' });
    });

    it('rejects an invalid signature when an app secret is configured', async () => {
      const connector = new InstagramConnector(
        makeConfig({ 'meta.appSecret': 'super-secret' }),
      );
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'IG_ACCOUNT',
            messaging: [
              {
                sender: { id: 'c' },
                recipient: { id: 'me' },
                timestamp: 1,
                message: { mid: 'm', text: 'hi' },
              },
            ],
          },
        ],
      };

      const events = await connector.handleWebhook(payload, 'sha256=deadbeef');

      expect(events).toEqual([]);
    });
  });
});
