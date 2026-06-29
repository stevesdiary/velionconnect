import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.region = config.get<string>('aws.region') ?? 'us-east-1';
    this.bucket = config.get<string>('aws.s3Bucket') ?? '';
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.get<string>('aws.accessKeyId') ?? '',
        secretAccessKey: config.get<string>('aws.secretAccessKey') ?? '',
      },
    });
  }

  async getPresignedUpload(
    orgId: string,
    mimeType: string,
    filename: string,
  ): Promise<PresignedUploadResult> {
    const ext = filename.split('.').pop() ?? 'bin';
    const key = `media/${orgId}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    const publicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { uploadUrl, key, publicUrl };
  }

  async confirmUpload(
    orgId: string,
    workspaceId: string | null,
    uploadedBy: string,
    dto: {
      key: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      width?: number;
      height?: number;
    },
  ) {
    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${dto.key}`;
    const filename = dto.key.split('/').pop() ?? dto.key;

    return this.prisma.media.create({
      data: {
        organizationId: orgId,
        workspaceId: workspaceId ?? null,
        uploadedBy,
        filename,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        url,
        width: dto.width ?? null,
        height: dto.height ?? null,
      },
    });
  }

  async findAll(orgId: string, workspaceId?: string) {
    return this.prisma.media.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async remove(orgId: string, id: string) {
    const media = await this.prisma.media.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!media) throw new NotFoundException('Media not found');

    const key = media.url.split('.amazonaws.com/')[1];
    if (key) {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    }

    await this.prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
