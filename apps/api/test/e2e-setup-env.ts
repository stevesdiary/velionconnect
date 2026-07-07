/**
 * Environment defaults for e2e tests. Runs (via jest `setupFiles`) before the
 * Nest app is bootstrapped, so config factories see these values. Every entry
 * uses `??=` so a real environment (CI service containers, a developer's shell)
 * always wins over these local-friendly defaults.
 */
process.env.NODE_ENV ??= 'test';

// Point at the CI service-container defaults; override in the shell for a
// locally-run database on a non-standard port.
process.env.DATABASE_URL ??=
  'postgresql://velion:velion_dev@localhost:5432/velionconnect_test?schema=public';
process.env.REDIS_URL ??= 'redis://localhost:6379';

process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN ??= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ??= '30d';

// CryptoService requires a 32-byte (64 hex char) key or it throws at boot.
process.env.ENCRYPTION_KEY ??= '0'.repeat(64);

// Used by the Meta connectors' webhook challenge verification.
process.env.META_WHATSAPP_VERIFY_TOKEN ??= 'test-verify-token';
