import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogInput {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        ...input,
        before:
          input.before === undefined
            ? undefined
            : input.before === null
              ? Prisma.DbNull
              : (input.before as Prisma.InputJsonValue),
        after:
          input.after === undefined
            ? undefined
            : input.after === null
              ? Prisma.DbNull
              : (input.after as Prisma.InputJsonValue),
      },
    });
  }
}
