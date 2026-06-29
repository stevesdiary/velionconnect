import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrgRole } from '@velion/types';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST') ?? 'localhost',
      port: parseInt(config.get<string>('SMTP_PORT') ?? '1025', 10),
      auth: config.get<string>('SMTP_USER')
        ? {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          }
        : undefined,
    });
  }

  async create(orgId: string, invitedBy: string, dto: CreateInviteDto) {
    if (dto.role === OrgRole.OWNER) {
      throw new ForbiddenException(
        'Cannot invite as OWNER — transfer ownership instead',
      );
    }

    const normalizedEmail = dto.email.toLowerCase();

    const existing = await this.prisma.invite.findFirst({
      where: {
        organizationId: orgId,
        email: normalizedEmail,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existing)
      throw new ConflictException(
        'A pending invite already exists for this email',
      );

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (user) {
      const member = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId: orgId, userId: user.id },
        },
      });
      if (member)
        throw new ConflictException(
          'User is already a member of this organization',
        );
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.invite.create({
      data: {
        organizationId: orgId,
        email: normalizedEmail,
        role: dto.role ?? OrgRole.MEMBER,
        token,
        invitedBy,
        expiresAt,
      },
      include: { organization: { select: { name: true } } },
    });

    await this.sendInviteEmail(
      invite.email,
      invite.organization.name,
      token,
      invite.role,
    );

    await this.audit.log({
      organizationId: orgId,
      userId: invitedBy,
      action: 'invite.created',
      entityType: 'Invite',
      entityId: invite.id,
      after: { email: normalizedEmail, role: invite.role },
    });

    return invite;
  }

  async findAll(orgId: string) {
    return this.prisma.invite.findMany({
      where: {
        organizationId: orgId,
        revokedAt: null,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByToken(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, avatarUrl: true },
        },
      },
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.revokedAt)
      throw new UnprocessableEntityException('Invite has been revoked');
    if (invite.acceptedAt)
      throw new UnprocessableEntityException(
        'Invite has already been accepted',
      );
    if (invite.expiresAt < new Date())
      throw new UnprocessableEntityException('Invite has expired');

    return invite;
  }

  async accept(token: string, userId: string) {
    const invite = await this.getByToken(token);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (user.email !== invite.email) {
      throw new ForbiddenException(
        'This invite was sent to a different email address',
      );
    }

    const member = await this.prisma.$transaction(async (tx) => {
      const membership = await tx.organizationMember.create({
        data: {
          organizationId: invite.organizationId,
          userId,
          role: invite.role,
        },
      });

      const defaultWs = await tx.workspace.findFirst({
        where: {
          organizationId: invite.organizationId,
          slug: 'default',
          deletedAt: null,
        },
      });
      if (defaultWs) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: defaultWs.id,
            organizationMemberId: membership.id,
            role: invite.role,
          },
        });
      }

      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return membership;
    });

    await this.audit.log({
      organizationId: invite.organizationId,
      userId,
      action: 'invite.accepted',
      entityType: 'Invite',
      entityId: invite.id,
    });

    return member;
  }

  async revoke(orgId: string, inviteId: string, userId: string) {
    const invite = await this.prisma.invite.findFirst({
      where: { id: inviteId, organizationId: orgId },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.acceptedAt)
      throw new UnprocessableEntityException(
        'Cannot revoke an accepted invite',
      );
    if (invite.revokedAt)
      throw new UnprocessableEntityException('Invite is already revoked');

    await this.prisma.invite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    });

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'invite.revoked',
      entityType: 'Invite',
      entityId: inviteId,
    });
  }

  private async sendInviteEmail(
    email: string,
    orgName: string,
    token: string,
    role: OrgRole,
  ): Promise<void> {
    const webUrl =
      this.config.get<string>('app.webUrl') ?? 'http://localhost:3000';
    const inviteUrl = `${webUrl}/invite/${token}`;

    await this.transporter.sendMail({
      from:
        process.env['EMAIL_FROM'] ??
        'VelionConnect <noreply@velionconnect.com>',
      to: email,
      subject: `You've been invited to join ${orgName} on VelionConnect`,
      html: `
        <p>You have been invited to join <strong>${orgName}</strong> as a ${role.toLowerCase()}.</p>
        <p>Click the link below to accept the invitation. It expires in 7 days.</p>
        <a href="${inviteUrl}">${inviteUrl}</a>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      `,
    });
  }
}
