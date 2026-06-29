import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export interface CreateLabelDto {
  name: string;
  color: string;
}

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.label.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
  }

  async create(orgId: string, dto: CreateLabelDto) {
    const existing = await this.prisma.label.findUnique({
      where: { organizationId_name: { organizationId: orgId, name: dto.name } },
    });
    if (existing)
      throw new ConflictException(`Label "${dto.name}" already exists`);

    return this.prisma.label.create({
      data: { organizationId: orgId, name: dto.name, color: dto.color },
    });
  }

  async update(orgId: string, id: string, dto: Partial<CreateLabelDto>) {
    const label = await this.prisma.label.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!label) throw new NotFoundException('Label not found');

    return this.prisma.label.update({
      where: { id },
      data: { name: dto.name, color: dto.color },
    });
  }

  async remove(orgId: string, id: string) {
    const label = await this.prisma.label.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!label) throw new NotFoundException('Label not found');
    await this.prisma.label.delete({ where: { id } });
  }
}
