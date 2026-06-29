import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GatewaysModule } from '../../gateways/gateways.module';
import { ConnectorsModule } from '../connectors/connectors.module';
import { ConversationsModule } from '../conversations/conversations.module';

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [AuthModule, GatewaysModule, ConnectorsModule, ConversationsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
