import { Injectable, NotFoundException } from '@nestjs/common';
import { ConversationChannel, ConversationStatus } from '@velion/types';

import { PrismaService } from '../../prisma/prisma.service';

import { ListConversationsDto } from './dto/list-conversations.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds or creates a conversation for a given contact + channel + thread.
   * Called on every inbound webhook after contact resolution.
   */
  async getOrCreate(
    orgId: string,
    contactId: string,
    channel: ConversationChannel,
    connectedAccountId: string,
    platformThreadId?: string,
  ) {
    // Try to find an existing open/pending conversation for this thread
    const existing = await this.prisma.conversation.findFirst({
      where: {
        organizationId: orgId,
        contactId,
        channel,
        connectedAccountId,
        ...(platformThreadId ? { platformThreadId } : {}),
        status: { in: [ConversationStatus.OPEN, ConversationStatus.PENDING] },
        deletedAt: null,
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        organizationId: orgId,
        contactId,
        channel,
        connectedAccountId,
        platformThreadId: platformThreadId ?? null,
        status: ConversationStatus.OPEN,
      },
    });
  }

  async findAll(
    orgId: string,
    workspaceId: string,
    dto: ListConversationsDto = {},
  ) {
    const limit = Math.min(dto.limit ?? 20, 100);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        organizationId: orgId,
        workspaceId,
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.channel ? { channel: dto.channel } : {}),
        ...(dto.assignedToId ? { assignedToId: dto.assignedToId } : {}),
        ...(dto.isStarred !== undefined ? { isStarred: dto.isStarred } : {}),
      },
      include: {
        contact: { select: { id: true, displayName: true, avatarUrl: true } },
        labels: { select: { id: true, name: true, color: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit + 1,
      ...(dto.cursor ? { cursor: { id: dto.cursor }, skip: 1 } : {}),
    });

    const hasMore = conversations.length > limit;
    return {
      data: conversations.slice(0, limit),
      nextCursor: hasMore ? conversations[limit - 1].id : null,
    };
  }

  async findById(orgId: string, id: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, organizationId: orgId },
      include: {
        contact: { include: { identities: true } },
        labels: true,
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async update(orgId: string, id: string, dto: UpdateConversationDto) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) data['status'] = dto.status;
    if (dto.isStarred !== undefined) data['isStarred'] = dto.isStarred;
    if (dto.assignedToId !== undefined) data['assignedToId'] = dto.assignedToId;
    if (dto.workspaceId !== undefined) data['workspaceId'] = dto.workspaceId;

    return this.prisma.conversation.update({ where: { id }, data });
  }

  async addLabel(orgId: string, conversationId: string, labelId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: orgId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { labels: { connect: { id: labelId } } },
    });
  }

  async removeLabel(orgId: string, conversationId: string, labelId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: orgId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { labels: { disconnect: { id: labelId } } },
    });
  }

  async incrementUnread(conversationId: string) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: { increment: 1 } },
    });
  }

  async markRead(orgId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: orgId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
  }

  async updateLastMessage(
    conversationId: string,
    preview: string,
    sentAt: Date,
  ) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: sentAt,
        lastMessagePreview: preview.slice(0, 200),
      },
    });
  }
}
