import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();

    // Soft-delete middleware: automatically filter out deleted records
    this.$use(async (params, next) => {
      const modelsWithSoftDelete = [
        'User',
        'Organization',
        'Workspace',
        'ConnectedAccount',
        'Contact',
        'Conversation',
        'Post',
        'Campaign',
        'Media',
      ];

      if (params.model && modelsWithSoftDelete.includes(params.model)) {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args = {
            ...params.args,
            where: { ...params.args?.['where'], deletedAt: null },
          };
        }
        if (params.action === 'findMany') {
          if (!params.args) params.args = {};
          if (!params.args['where']) params.args['where'] = {};
          params.args['where']['deletedAt'] = null;
        }
      }
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
