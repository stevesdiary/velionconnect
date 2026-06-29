import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CryptoService } from '../../common/crypto.service';

import { ConnectedAccountsController } from './connected-accounts.controller';
import { ConnectedAccountsService } from './connected-accounts.service';
import { ConnectorFactory } from './connector.factory';
import { FacebookConnector } from './facebook/facebook.connector';
import { InstagramConnector } from './instagram/instagram.connector';
import { LinkedInConnector } from './linkedin/linkedin.connector';
import { WhatsAppConnector } from './whatsapp/whatsapp.connector';

@Module({
  imports: [AuthModule],
  controllers: [ConnectedAccountsController],
  providers: [
    CryptoService,
    WhatsAppConnector,
    InstagramConnector,
    FacebookConnector,
    LinkedInConnector,
    ConnectorFactory,
    ConnectedAccountsService,
  ],
  exports: [ConnectorFactory, ConnectedAccountsService],
})
export class ConnectorsModule {}
