import { Injectable, NotFoundException } from '@nestjs/common';
import { Platform } from '@velion/types';

import { PrismaService } from '../../prisma/prisma.service';

import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hot path called on every inbound webhook.
   * Finds or creates a Contact + ContactIdentity for the given platform sender.
   */
  async resolveOrCreate(
    orgId: string,
    platform: Platform,
    platformUserId: string,
    displayName: string,
    extra?: { email?: string; phone?: string; avatarUrl?: string },
  ) {
    // First: check by platform identity (fastest path)
    const identity = await this.prisma.contactIdentity.findFirst({
      where: {
        platform,
        platformUserId,
        contact: { organizationId: orgId, deletedAt: null },
      },
      include: { contact: true },
    });

    if (identity) return identity.contact;

    // Second: try to match by phone or email if provided
    if (extra?.phone || extra?.email) {
      const existing = await this.prisma.contact.findFirst({
        where: {
          organizationId: orgId,
          deletedAt: null,
          OR: [
            ...(extra.phone ? [{ phone: extra.phone }] : []),
            ...(extra.email ? [{ email: extra.email }] : []),
          ],
        },
      });

      if (existing) {
        // Attach the new platform identity (or update if contact already has one for this platform)
        await this.prisma.contactIdentity.upsert({
          where: { contactId_platform: { contactId: existing.id, platform } },
          create: {
            contactId: existing.id,
            platform,
            platformUserId,
            platformUsername: displayName,
            platformAvatarUrl: extra?.avatarUrl ?? null,
          },
          update: {
            platformUserId,
            platformUsername: displayName,
            platformAvatarUrl: extra?.avatarUrl ?? null,
          },
        });
        return existing;
      }
    }

    // Third: create a new contact
    return this.prisma.$transaction(async (tx) => {
      const contact = await tx.contact.create({
        data: {
          organizationId: orgId,
          displayName,
          email: extra?.email ?? null,
          phone: extra?.phone ?? null,
          avatarUrl: extra?.avatarUrl ?? null,
        },
      });

      await tx.contactIdentity.create({
        data: {
          contactId: contact.id,
          platform,
          platformUserId,
          platformUsername: displayName,
          platformAvatarUrl: extra?.avatarUrl ?? null,
        },
      });

      return contact;
    });
  }

  async findAll(
    orgId: string,
    opts: { search?: string; cursor?: string; limit?: number } = {},
  ) {
    const limit = Math.min(opts.limit ?? 20, 100);
    const contacts = await this.prisma.contact.findMany({
      where: {
        organizationId: orgId,
        ...(opts.search
          ? {
              OR: [
                { displayName: { contains: opts.search, mode: 'insensitive' } },
                { email: { contains: opts.search, mode: 'insensitive' } },
                { phone: { contains: opts.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { identities: true },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });

    const hasMore = contacts.length > limit;
    return {
      data: contacts.slice(0, limit),
      nextCursor: hasMore ? contacts[limit - 1].id : null,
    };
  }

  async findById(orgId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId: orgId },
      include: {
        identities: true,
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          take: 5,
          select: {
            id: true,
            channel: true,
            status: true,
            lastMessageAt: true,
            lastMessagePreview: true,
            unreadCount: true,
          },
        },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async update(orgId: string, id: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    return this.prisma.contact.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
        tags: dto.tags,
        timezone: dto.timezone,
        locale: dto.locale,
      },
    });
  }

  async merge(orgId: string, sourceId: string, targetId: string) {
    const [source, target] = await Promise.all([
      this.prisma.contact.findFirst({
        where: { id: sourceId, organizationId: orgId },
      }),
      this.prisma.contact.findFirst({
        where: { id: targetId, organizationId: orgId },
      }),
    ]);
    if (!source) throw new NotFoundException('Source contact not found');
    if (!target) throw new NotFoundException('Target contact not found');

    await this.prisma.$transaction([
      // Move all identities to target
      this.prisma.contactIdentity.updateMany({
        where: { contactId: sourceId },
        data: { contactId: targetId },
      }),
      // Move all conversations to target
      this.prisma.conversation.updateMany({
        where: { contactId: sourceId },
        data: { contactId: targetId },
      }),
      // Soft-delete source with merge pointer
      this.prisma.contact.update({
        where: { id: sourceId },
        data: { mergedIntoId: targetId, deletedAt: new Date() },
      }),
    ]);

    return this.findById(orgId, targetId);
  }
}
