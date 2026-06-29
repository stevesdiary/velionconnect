import { registerAs } from '@nestjs/config';

export const metaConfig = registerAs('meta', () => ({
  appId: process.env['META_APP_ID'] ?? '',
  appSecret: process.env['META_APP_SECRET'] ?? '',
  whatsappVerifyToken: process.env['META_WHATSAPP_VERIFY_TOKEN'] ?? '',
  graphApiVersion: 'v19.0',
}));
