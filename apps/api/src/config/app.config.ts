import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  apiUrl: process.env['API_URL'] ?? 'http://localhost:3001',
  webUrl: process.env['WEB_URL'] ?? 'http://localhost:3000',
  corsOrigins: process.env['CORS_ORIGINS']?.split(',') ?? [
    'http://localhost:3000',
  ],
  internalApiKey: process.env['INTERNAL_API_KEY'] ?? '',
  encryptionKey: process.env['ENCRYPTION_KEY'] ?? '',
}));
