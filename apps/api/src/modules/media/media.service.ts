import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { ObjectStorageService } from '../storage/object-storage.service';

export { PresignedUploadResult } from '../storage/object-storage.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorageService,
  ) {}

  async getPresignedUpload(orgId: string, mimeType: string, filename: string) {
    const ext = filename.split('.').pop() ?? 'bin';
    const key = `media/${orgId}/${randomUUID()}.${ext}`;
    return this.storage.presignUpload(key, mimeType);
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
    const url = this.storage.publicUrl(dto.key);
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

    const key = this.storage.keyFromUrl(media.url);
    if (key) {
      await this.storage.deleteObject(key);
    }

    await this.prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
