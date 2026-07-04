import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrgRole } from '@velion/types';
import slugify from 'slugify';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const baseSlug = slugify(dto.name, { lower: true, strict: true });
    const slug = await this.generateUniqueSlug(baseSlug);

    const org = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.name,
          slug,
          timezone: dto.timezone ?? 'Africa/Lagos',
          locale: dto.locale ?? 'en-NG',
          currency: dto.currency ?? 'NGN',
        },
      });

      const membership = await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: OrgRole.OWNER,
        },
      });

      // Auto-create the default workspace
      const workspace = await tx.workspace.create({
        data: {
          organizationId: organization.id,
          name: 'Default',
          slug: 'default',
        },
      });

      // Add owner to default workspace
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          organizationMemberId: membership.id,
          role: OrgRole.OWNER,
        },
      });

      return organization;
    });

    await this.audit.log({
      organizationId: org.id,
      userId,
      action: 'organization.created',
      entityType: 'Organization',
      entityId: org.id,
      after: { name: org.name, slug: org.slug },
    });

    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        avatarUrl: true,
        timezone: true,
        locale: true,
        currency: true,
        plan: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, userId: string, dto: UpdateOrganizationDto) {
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: dto,
    });

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'organization.updated',
      entityType: 'Organization',
      entityId: orgId,
      after: dto as Record<string, unknown>,
    });

    return org;
  }

  async getMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberRole(
    orgId: string,
    actingUserId: string,
    targetUserId: string,
    role: OrgRole,
  ) {
    // Cannot change the role of the last owner
    if (role !== OrgRole.OWNER) {
      const ownerCount = await this.prisma.organizationMember.count({
        where: { organizationId: orgId, role: OrgRole.OWNER },
      });
      const target = await this.prisma.organizationMember.findFirst({
        where: { organizationId: orgId, userId: targetUserId },
      });
      if (ownerCount === 1 && target?.role === OrgRole.OWNER) {
        throw new ForbiddenException('Cannot remove the last owner');
      }
    }

    const updated = await this.prisma.organizationMember.update({
      where: {
        organizationId_userId: { organizationId: orgId, userId: targetUserId },
      },
      data: { role },
    });

    await this.audit.log({
      organizationId: orgId,
      userId: actingUserId,
      action: 'organization.member_role_changed',
      entityType: 'OrganizationMember',
      entityId: targetUserId,
      after: { role },
    });

    return updated;
  }

  async removeMember(
    orgId: string,
    actingUserId: string,
    targetUserId: string,
  ) {
    if (actingUserId === targetUserId) {
      throw new ForbiddenException(
        'Cannot remove yourself — transfer ownership first',
      );
    }

    const target = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: targetUserId },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === OrgRole.OWNER) {
      throw new ForbiddenException('Cannot remove an owner');
    }

    await this.prisma.organizationMember.delete({
      where: {
        organizationId_userId: { organizationId: orgId, userId: targetUserId },
      },
    });

    await this.audit.log({
      organizationId: orgId,
      userId: actingUserId,
      action: 'organization.member_removed',
      entityType: 'OrganizationMember',
      entityId: targetUserId,
    });
  }

  async findOrgIdBySlug(slug: string): Promise<string> {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org.id;
  }

  private async generateUniqueSlug(base: string): Promise<string> {
    let slug = base;
    let attempt = 0;
    while (true) {
      const existing = await this.prisma.organization.findUnique({
        where: { slug },
      });
      if (!existing) return slug;
      attempt++;
      slug = `${base}-${attempt}`;
    }
  }
}
