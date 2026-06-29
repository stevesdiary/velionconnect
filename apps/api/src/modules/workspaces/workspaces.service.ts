import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrgRole } from '@velion/types';
import slugify from 'slugify';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';

import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(orgId: string) {
    return this.prisma.workspace.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findBySlug(orgId: string, slug: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { organizationId: orgId, slug, deletedAt: null },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async create(orgId: string, userId: string, dto: CreateWorkspaceDto) {
    const baseSlug = slugify(dto.name, { lower: true, strict: true });
    const slug = await this.generateUniqueSlug(orgId, baseSlug);

    const workspace = await this.prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          organizationId: orgId,
          name: dto.name,
          slug,
          description: dto.description,
          timezone: dto.timezone,
        },
      });

      const orgMember = await tx.organizationMember.findUniqueOrThrow({
        where: { organizationId_userId: { organizationId: orgId, userId } },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          organizationMemberId: orgMember.id,
          role: OrgRole.OWNER,
        },
      });

      return ws;
    });

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'workspace.created',
      entityType: 'Workspace',
      entityId: workspace.id,
      after: { name: workspace.name, slug: workspace.slug },
    });

    return workspace;
  }

  async update(
    workspaceId: string,
    orgId: string,
    userId: string,
    dto: UpdateWorkspaceDto,
  ) {
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
    });

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'workspace.updated',
      entityType: 'Workspace',
      entityId: workspaceId,
      after: dto as Record<string, unknown>,
    });

    return workspace;
  }

  async remove(workspaceId: string, orgId: string, userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, organizationId: orgId, deletedAt: null },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.slug === 'default') {
      throw new ForbiddenException('Cannot delete the default workspace');
    }

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'workspace.deleted',
      entityType: 'Workspace',
      entityId: workspaceId,
    });
  }

  async getMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        organizationMember: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(
    workspaceId: string,
    orgId: string,
    dto: AddWorkspaceMemberDto,
  ) {
    const orgMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: dto.userId },
      },
    });
    if (!orgMember)
      throw new NotFoundException('User is not a member of this organization');

    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_organizationMemberId: {
          workspaceId,
          organizationMemberId: orgMember.id,
        },
      },
    });
    if (existing)
      throw new ConflictException('User is already a workspace member');

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        organizationMemberId: orgMember.id,
        role: dto.role ?? OrgRole.MEMBER,
      },
    });
  }

  async removeMember(workspaceId: string, orgId: string, targetUserId: string) {
    const orgMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: targetUserId },
      },
    });
    if (!orgMember) throw new NotFoundException('Member not found');

    await this.prisma.workspaceMember.delete({
      where: {
        workspaceId_organizationMemberId: {
          workspaceId,
          organizationMemberId: orgMember.id,
        },
      },
    });
  }

  async updateMemberRole(
    workspaceId: string,
    orgId: string,
    targetUserId: string,
    role: OrgRole,
  ) {
    const orgMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: targetUserId },
      },
    });
    if (!orgMember) throw new NotFoundException('Member not found');

    return this.prisma.workspaceMember.update({
      where: {
        workspaceId_organizationMemberId: {
          workspaceId,
          organizationMemberId: orgMember.id,
        },
      },
      data: { role },
    });
  }

  private async generateUniqueSlug(
    orgId: string,
    base: string,
  ): Promise<string> {
    let slug = base;
    let attempt = 0;
    while (true) {
      const existing = await this.prisma.workspace.findFirst({
        where: { organizationId: orgId, slug },
      });
      if (!existing) return slug;
      attempt++;
      slug = `${base}-${attempt}`;
    }
  }
}
