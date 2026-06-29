import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

import { PublishingController } from './publishing.controller';
import { PublishingService, POST_PUBLISHER_QUEUE } from './publishing.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    BullModule.registerQueue({ name: POST_PUBLISHER_QUEUE }),
  ],
  controllers: [PublishingController],
  providers: [PublishingService],
  exports: [PublishingService],
})
export class PublishingModule {}
