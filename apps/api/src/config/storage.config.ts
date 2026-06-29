import { registerAs } from '@nestjs/config';

/**
 * Object storage config. Works with any S3-compatible provider.
 *
 * Provider-specific guidance:
 *
 * AWS S3:
 *   STORAGE_PROVIDER=s3
 *   STORAGE_REGION=us-east-1
 *   STORAGE_BUCKET=my-bucket
 *   STORAGE_ACCESS_KEY_ID=AKIAxxx
 *   STORAGE_SECRET_ACCESS_KEY=xxx
 *   # STORAGE_ENDPOINT and STORAGE_PUBLIC_URL are optional; auto-constructed.
 *
 * Backblaze B2:
 *   STORAGE_PROVIDER=backblaze-b2
 *   STORAGE_REGION=us-west-004          # your B2 region
 *   STORAGE_BUCKET=my-bucket
 *   STORAGE_ACCESS_KEY_ID=<B2 key ID>
 *   STORAGE_SECRET_ACCESS_KEY=<B2 app key>
 *   STORAGE_ENDPOINT=https://s3.us-west-004.backblazeb2.com
 *   STORAGE_PUBLIC_URL=https://my-bucket.s3.us-west-004.backblazeb2.com
 *   # Or set STORAGE_PUBLIC_URL to your custom CDN/domain.
 *   # For public buckets use: https://f004.backblazeb2.com/file/my-bucket
 *
 * Cloudflare R2:
 *   STORAGE_PROVIDER=cloudflare-r2
 *   STORAGE_REGION=auto                 # R2 is global; use "auto"
 *   STORAGE_BUCKET=my-bucket
 *   STORAGE_ACCESS_KEY_ID=<R2 access key ID>
 *   STORAGE_SECRET_ACCESS_KEY=<R2 secret access key>
 *   STORAGE_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 *   STORAGE_PUBLIC_URL=https://pub-xxx.r2.dev  # or your custom domain
 */
export const storageConfig = registerAs('storage', () => ({
  provider: (process.env['STORAGE_PROVIDER'] ?? 's3') as
    's3' | 'backblaze-b2' | 'cloudflare-r2',
  bucket: process.env['STORAGE_BUCKET'] ?? '',
  region: process.env['STORAGE_REGION'] ?? 'us-east-1',
  accessKeyId: process.env['STORAGE_ACCESS_KEY_ID'] ?? '',
  secretAccessKey: process.env['STORAGE_SECRET_ACCESS_KEY'] ?? '',
  // Custom S3-compatible endpoint URL. Required for B2 and R2; optional for AWS S3.
  endpoint: process.env['STORAGE_ENDPOINT'] ?? '',
  // Base URL for publicly accessible objects (without trailing slash).
  // Auto-constructed for AWS S3 if omitted. Required for B2 and R2.
  publicUrl: process.env['STORAGE_PUBLIC_URL'] ?? '',
  // Force path-style URLs (required for B2; not needed for R2 or S3).
  // Defaults to true when provider is backblaze-b2.
  forcePathStyle:
    process.env['STORAGE_FORCE_PATH_STYLE'] !== undefined
      ? process.env['STORAGE_FORCE_PATH_STYLE'] === 'true'
      : (process.env['STORAGE_PROVIDER'] ?? 's3') === 'backblaze-b2',
}));
