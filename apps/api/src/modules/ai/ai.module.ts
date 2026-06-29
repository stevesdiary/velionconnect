import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';

export const AI_SUGGESTION_QUEUE = 'ai-suggestion';

@Module({
  imports: [
    BullModule.registerQueue({ name: AI_SUGGESTION_QUEUE }),
    AuthModule,
    PrismaModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService, BullModule],
})
export class AiModule {}
