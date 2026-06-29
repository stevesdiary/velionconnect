import { registerAs } from '@nestjs/config';

export const linkedinConfig = registerAs('linkedin', () => ({
  clientId: process.env['LINKEDIN_CLIENT_ID'] ?? '',
  clientSecret: process.env['LINKEDIN_CLIENT_SECRET'] ?? '',
}));
