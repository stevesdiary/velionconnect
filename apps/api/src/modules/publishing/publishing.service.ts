import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PostStatus } from '@velion/types';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

export const POST_PUBLISHER_QUEUE = 'post-publisher';

@Injectable()
export class PublishingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @InjectQueue(POST_PUBLISHER_QUEUE) private readonly publishQueue: Queue,
  ) {}

  private async resolveWorkspace(orgId: string, workspaceSlug: string) {
    const ws = await this.prisma.workspace.findFirst({
      where: { slug: workspaceSlug, organizationId: orgId },
    });
    if (!ws) throw new NotFoundException('Workspace not found');
    return ws;
  }

  async findAll(
    orgId: string,
    workspaceSlug: string,
    filters?: { status?: PostStatus; from?: string; to?: string },
  ) {
    const workspace = await this.resolveWorkspace(orgId, workspaceSlug);
    return this.prisma.post.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.from || filters?.to
          ? {
              scheduledAt: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              },
            }
          : {}),
      },
      include: {
        media: { orderBy: { order: 'asc' } },
        connectedAccount: {
          select: { id: true, platform: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, workspaceSlug: string, id: string) {
    const workspace = await this.resolveWorkspace(orgId, workspaceSlug);
    const post = await this.prisma.post.findFirst({
      where: { id, workspaceId: workspace.id, deletedAt: null },
      include: {
        media: { orderBy: { order: 'asc' } },
        connectedAccount: {
          select: { id: true, platform: true, displayName: true },
        },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(
    orgId: string,
    workspaceSlug: string,
    userId: string,
    dto: CreatePostDto,
  ) {
    const workspace = await this.resolveWorkspace(orgId, workspaceSlug);

    const account = await this.prisma.connectedAccount.findFirst({
      where: { id: dto.connectedAccountId, organizationId: orgId },
    });
    if (!account) throw new NotFoundException('Connected account not found');

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    const status = scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT;

    const post = await this.prisma.post.create({
      data: {
        organizationId: orgId,
        workspaceId: workspace.id,
        connectedAccountId: dto.connectedAccountId,
        caption: dto.caption ?? null,
        scheduledAt,
        status,
        createdBy: userId,
        media: dto.mediaUrls
          ? {
              create: dto.mediaUrls.map((url, i) => ({
                url,
                order: i,
                type: guessMediaType(url),
              })),
            }
          : undefined,
      },
      include: { media: { orderBy: { order: 'asc' } } },
    });

    if (status === PostStatus.SCHEDULED && scheduledAt) {
      await this.scheduleJob(post.id, scheduledAt);
    }

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'post.created',
      entityType: 'Post',
      entityId: post.id,
    });

    return post;
  }

  async update(
    orgId: string,
    workspaceSlug: string,
    id: string,
    userId: string,
    dto: UpdatePostDto,
  ) {
    const post = await this.findOne(orgId, workspaceSlug, id);

    if (
      post.status === PostStatus.PUBLISHED ||
      post.status === PostStatus.PUBLISHING
    ) {
      throw new BadRequestException('Cannot edit a published post');
    }

    const scheduledAt =
      dto.scheduledAt !== undefined
        ? dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : null
        : post.scheduledAt;

    const status =
      scheduledAt != null
        ? PostStatus.SCHEDULED
        : post.status === PostStatus.SCHEDULED
          ? PostStatus.DRAFT
          : post.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.mediaUrls !== undefined) {
        await tx.postMedia.deleteMany({ where: { postId: id } });
        if (dto.mediaUrls.length > 0) {
          await tx.postMedia.createMany({
            data: dto.mediaUrls.map((url, i) => ({
              postId: id,
              url,
              order: i,
              type: guessMediaType(url),
            })),
          });
        }
      }

      return tx.post.update({
        where: { id },
        data: {
          caption: dto.caption ?? post.caption,
          scheduledAt,
          status,
        },
        include: { media: { orderBy: { order: 'asc' } } },
      });
    });

    if (status === PostStatus.SCHEDULED && scheduledAt) {
      await this.scheduleJob(id, scheduledAt);
    }

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'post.updated',
      entityType: 'Post',
      entityId: id,
    });

    return updated;
  }

  async remove(
    orgId: string,
    workspaceSlug: string,
    id: string,
    userId: string,
  ) {
    const post = await this.findOne(orgId, workspaceSlug, id);

    if (post.status === PostStatus.PUBLISHING) {
      throw new BadRequestException(
        'Cannot delete a post that is currently publishing',
      );
    }

    await this.prisma.post.delete({ where: { id } });

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'post.deleted',
      entityType: 'Post',
      entityId: id,
    });
  }

  async publishNow(
    orgId: string,
    workspaceSlug: string,
    id: string,
    userId: string,
  ) {
    const post = await this.findOne(orgId, workspaceSlug, id);

    if (post.status === PostStatus.PUBLISHED) {
      throw new BadRequestException('Post is already published');
    }

    await this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.SCHEDULED, scheduledAt: new Date() },
    });

    await this.publishQueue.add('publish', { postId: id }, { attempts: 3 });

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'post.publish_now',
      entityType: 'Post',
      entityId: id,
    });

    return { message: 'Publishing queued' };
  }

  private async scheduleJob(postId: string, scheduledAt: Date) {
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    await this.publishQueue.add(
      'publish',
      { postId },
      {
        delay,
        jobId: `post-${postId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    );
  }
}

function guessMediaType(url: string): string {
  const ext = url.split('?')[0]?.split('.').pop()?.toLowerCase() ?? '';
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  return 'image';
}
