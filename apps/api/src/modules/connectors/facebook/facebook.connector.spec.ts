import * as crypto from 'crypto';

import { ConfigService } from '@nestjs/config';
import { Platform } from '@velion/types';

import { FacebookConnector } from './facebook.connector';

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

describe('FacebookConnector', () => {
  describe('platform', () => {
    it('reports the FACEBOOK platform', () => {
      const connector = new FacebookConnector(makeConfig());
      expect(connector.platform).toBe(Platform.FACEBOOK);
    });
  });

  describe('verifyWebhookChallenge', () => {
    const connector = new FacebookConnector(makeConfig());

    it('echoes the challenge when the verify token matches', () => {
      expect(connector.verifyWebhookChallenge('chal', 'verify-token-123')).toBe(
        'chal',
      );
    });

    it('returns null when the verify token does not match', () => {
      expect(connector.verifyWebhookChallenge('chal', 'nope')).toBeNull();
    });
  });

  describe('handleWebhook', () => {
    it('parses a Messenger message with an attachment', async () => {
      const connector = new FacebookConnector(makeConfig());
      const payload = {
        object: 'page',
        entry: [
          {
            id: 'PAGE',
            messaging: [
              {
                sender: { id: 'user-1' },
                recipient: { id: 'page' },
                timestamp: 1700000000000,
                message: {
                  mid: 'm-1',
                  text: 'Hi page',
                  attachments: [
                    { type: 'file', payload: { url: 'https://cdn/doc.pdf' } },
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
        platformMessageId: 'm-1',
        platformSenderId: 'user-1',
        text: 'Hi page',
        mediaUrls: ['https://cdn/doc.pdf'],
      });
      expect(events[0]!.timestamp).toEqual(new Date(1700000000000));
    });

    it('parses a postback into a synthetic message event', async () => {
      const connector = new FacebookConnector(makeConfig());
      const payload = {
        object: 'page',
        entry: [
          {
            id: 'PAGE',
            messaging: [
              {
                sender: { id: 'user-2' },
                recipient: { id: 'page' },
                timestamp: 1700000009000,
                postback: { title: 'Get Started', payload: 'GET_STARTED' },
              },
            ],
          },
        ],
      };

      const events = await connector.handleWebhook(payload, '');

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'message',
        platformMessageId: 'postback_1700000009000_user-2',
        platformSenderId: 'user-2',
        text: 'Get Started',
        mediaUrls: [],
      });
    });

    it('parses multiple messaging events in one entry', async () => {
      const connector = new FacebookConnector(makeConfig());
      const payload = {
        object: 'page',
        entry: [
          {
            id: 'PAGE',
            messaging: [
              {
                sender: { id: 'u1' },
                recipient: { id: 'page' },
                timestamp: 1,
                message: { mid: 'a', text: 'first' },
              },
              {
                sender: { id: 'u2' },
                recipient: { id: 'page' },
                timestamp: 2,
                message: { mid: 'b', text: 'second' },
              },
            ],
          },
        ],
      };

      const events = await connector.handleWebhook(payload, '');

      expect(events.map((e) => e.platformMessageId)).toEqual(['a', 'b']);
    });

    it('returns an empty array when there are no entries', async () => {
      const connector = new FacebookConnector(makeConfig());
      expect(await connector.handleWebhook({ object: 'page' }, '')).toEqual([]);
    });

    it('rejects an invalid signature when an app secret is configured', async () => {
      const connector = new FacebookConnector(
        makeConfig({ 'meta.appSecret': 'shh' }),
      );
      const payload = {
        object: 'page',
        entry: [
          {
            id: 'PAGE',
            messaging: [
              {
                sender: { id: 'u' },
                recipient: { id: 'page' },
                timestamp: 1,
                message: { mid: 'm', text: 'hi' },
              },
            ],
          },
        ],
      };

      expect(await connector.handleWebhook(payload, 'sha256=bad')).toEqual([]);
    });

    it('accepts a valid signature when an app secret is configured', async () => {
      const appSecret = 'shh';
      const connector = new FacebookConnector(
        makeConfig({ 'meta.appSecret': appSecret }),
      );
      const payload = {
        object: 'page',
        entry: [
          {
            id: 'PAGE',
            messaging: [
              {
                sender: { id: 'u' },
                recipient: { id: 'page' },
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
  });
});
