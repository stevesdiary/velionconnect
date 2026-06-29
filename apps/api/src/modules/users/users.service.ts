import { Injectable, NotFoundException } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { PrismaService } from '../../prisma/prisma.service';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        timezone: true,
        locale: true,
        currency: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        timezone: true,
        locale: true,
        currency: true,
      },
    });
  }

  async getUserOrganizations(userId: string) {
    return this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatarUrl: true,
            plan: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }
}
