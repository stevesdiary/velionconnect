import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

type StorageProvider = 's3' | 'backblaze-b2' | 'cloudflare-r2';

@Injectable()
export class ObjectStorageService implements OnModuleInit {
  private readonly logger = new Logger(ObjectStorageService.name);
  private client!: S3Client;
  private bucket!: string;
  private publicUrlBase!: string;
  private provider!: StorageProvider;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.provider =
      this.config.get<StorageProvider>('storage.provider') ?? 's3';
    this.bucket = this.config.get<string>('storage.bucket') ?? '';
    const region = this.config.get<string>('storage.region') ?? 'us-east-1';
    const accessKeyId = this.config.get<string>('storage.accessKeyId') ?? '';
    const secretAccessKey =
      this.config.get<string>('storage.secretAccessKey') ?? '';
    const endpoint = this.config.get<string>('storage.endpoint') ?? '';
    const forcePathStyle =
      this.config.get<boolean>('storage.forcePathStyle') ?? false;
    const configuredPublicUrl =
      this.config.get<string>('storage.publicUrl') ?? '';

    this.client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle,
    });

    this.publicUrlBase =
      configuredPublicUrl || this.derivePublicUrl(region, endpoint);

    this.logger.log(
      `Object storage initialised — provider=${this.provider} bucket=${this.bucket}`,
    );

    if (!this.publicUrlBase) {
      this.logger.warn(
        `STORAGE_PUBLIC_URL is not set for provider "${this.provider}". ` +
          'Public URLs will be empty. Set STORAGE_PUBLIC_URL in your environment.',
      );
    }
  }

  /**
   * Generate a pre-signed PUT URL for direct browser-to-storage upload.
   * The caller receives the key to pass back during confirm.
   */
  async presignUpload(
    key: string,
    mimeType: string,
    expiresIn = 300,
  ): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    return {
      uploadUrl,
      key,
      publicUrl: this.publicUrl(key),
    };
  }

  /** Build the publicly accessible URL for a stored object. */
  publicUrl(key: string): string {
    return `${this.publicUrlBase}/${key}`;
  }

  /**
   * Extract the storage key from a previously returned public URL.
   * Used when the key is not stored separately (e.g. during delete).
   */
  keyFromUrl(url: string): string | null {
    if (!this.publicUrlBase || !url.startsWith(this.publicUrlBase)) return null;
    return url.slice(this.publicUrlBase.length + 1); // strip base + "/"
  }

  /** Permanently delete an object from storage. */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private derivePublicUrl(region: string, endpoint: string): string {
    switch (this.provider) {
      case 's3':
        // AWS virtual-hosted style
        return `https://${this.bucket}.s3.${region}.amazonaws.com`;

      case 'backblaze-b2':
        // Best-effort derivation from the S3-compatible endpoint.
        // e.g. https://s3.us-west-004.backblazeb2.com → https://my-bucket.s3.us-west-004.backblazeb2.com
        // Operators should set STORAGE_PUBLIC_URL to their Backblaze-friendly CDN URL instead.
        if (endpoint) {
          const host = new URL(endpoint).host;
          return `https://${this.bucket}.${host}`;
        }
        return '';

      case 'cloudflare-r2':
        // R2 requires an explicit r2.dev subdomain or custom domain. Cannot auto-derive.
        return '';

      default:
        return '';
    }
  }
}
