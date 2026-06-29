import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(orgId: string, query: string, limit = 20) {
    const q = query.trim();
    if (!q) return { conversations: [], contacts: [], messages: [] };

    const [conversations, contacts, messages] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          organizationId: orgId,
          lastMessagePreview: { contains: q, mode: 'insensitive' },
        },
        include: {
          contact: { select: { id: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
      }),

      this.prisma.contact.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { displayName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
      }),

      this.prisma.message.findMany({
        where: {
          conversation: { organizationId: orgId },
          content: { contains: q, mode: 'insensitive' },
          isDeleted: false,
        },
        include: {
          conversation: {
            select: {
              id: true,
              channel: true,
              contact: { select: { displayName: true } },
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        take: limit,
      }),
    ]);

    return { conversations, contacts, messages };
  }
}
