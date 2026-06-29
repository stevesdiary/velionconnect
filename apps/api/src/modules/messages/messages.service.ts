import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
  Platform,
} from '@velion/types';

import { PrismaService } from '../../prisma/prisma.service';
import { ConnectedAccountsService } from '../connectors/connected-accounts.service';
import { ConnectorFactory } from '../connectors/connector.factory';
import { ConversationsService } from '../conversations/conversations.service';

import { SendMessageDto } from './dto/send-message.dto';

export interface CreateInboundMessageInput {
  conversationId: string;
  connectedAccountId: string;
  platformMessageId: string;
  content: string | null;
  type?: MessageType;
  mediaUrls?: string[];
  sentAt: Date;
  platformSenderId?: string;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectedAccounts: ConnectedAccountsService,
    private readonly connectorFactory: ConnectorFactory,
    private readonly conversations: ConversationsService,
  ) {}

  async findAll(
    orgId: string,
    conversationId: string,
    opts: { cursor?: string; limit?: number } = {},
  ) {
    // Verify conversation belongs to org
    await this.conversations.findById(orgId, conversationId);

    const limit = Math.min(opts.limit ?? 30, 100);
    const messages = await this.prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      include: {
        attachments: true,
        replyTo: {
          select: { id: true, content: true, direction: true, type: true },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    return {
      data: messages.slice(0, limit),
      nextCursor: hasMore ? messages[limit - 1].id : null,
    };
  }

  async createInbound(input: CreateInboundMessageInput) {
    // Idempotent: skip if already recorded
    const existing = await this.prisma.message.findUnique({
      where: {
        platformMessageId_connectedAccountId: {
          platformMessageId: input.platformMessageId,
          connectedAccountId: input.connectedAccountId,
        },
      },
    });
    if (existing) return existing;

    const message = await this.prisma.message.create({
      data: {
        conversationId: input.conversationId,
        connectedAccountId: input.connectedAccountId,
        platformMessageId: input.platformMessageId,
        direction: MessageDirection.INBOUND,
        type: input.type ?? MessageType.TEXT,
        status: MessageStatus.DELIVERED,
        content: input.content,
        sentAt: input.sentAt,
        ...(input.mediaUrls?.length
          ? {
              attachments: {
                create: input.mediaUrls.map((url) => ({ url, type: 'image' })),
              },
            }
          : {}),
      },
      include: { attachments: true },
    });

    await this.conversations.updateLastMessage(
      input.conversationId,
      input.content ?? '[media]',
      input.sentAt,
    );
    await this.conversations.incrementUnread(input.conversationId);

    return message;
  }

  async send(
    orgId: string,
    conversationId: string,
    dto: SendMessageDto,
    userId: string,
  ) {
    if (!dto.text && !dto.mediaUrl) {
      throw new BadRequestException('Either text or mediaUrl is required');
    }

    const conversation = await this.conversations.findById(
      orgId,
      conversationId,
    );
    if (!conversation.connectedAccountId) {
      throw new BadRequestException('Conversation has no connected account');
    }

    const account = await this.connectedAccounts.getDecryptedAccount(
      orgId,
      conversation.connectedAccountId,
    );

    // Get the "to" address: the contact's platform ID for this channel
    const contactIdentity = await this.prisma.contactIdentity.findFirst({
      where: {
        contactId: conversation.contactId,
        platform: account.platform as Platform,
      },
    });
    if (!contactIdentity) {
      throw new NotFoundException('Contact has no identity for this channel');
    }

    const connector = this.connectorFactory.getConnector(
      account.platform as Platform,
    );
    const sent = await connector.sendMessage(
      {
        ...account,
        metadata: account.metadata as Record<string, unknown>,
        scopes: account.scopes,
      },
      {
        to: contactIdentity.platformUserId,
        text: dto.text,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        replyToId: dto.replyToId,
      },
    );

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        connectedAccountId: account.id,
        platformMessageId: sent.platformMessageId,
        direction: MessageDirection.OUTBOUND,
        type: dto.type ?? (dto.mediaUrl ? MessageType.IMAGE : MessageType.TEXT),
        status: MessageStatus.SENT,
        content: dto.text ?? null,
        sentAt: sent.sentAt,
        replyToId: dto.replyToId ?? null,
      },
      include: { attachments: true },
    });

    await this.conversations.updateLastMessage(
      conversationId,
      dto.text ?? '[media]',
      sent.sentAt,
    );

    void userId; // audit log could go here

    return message;
  }
}
