import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountStatus, Platform } from '@velion/types';

import { PrismaService } from '../prisma/prisma.service';
import { ConnectorFactory } from '../modules/connectors/connector.factory';
import { ConnectedAccountsService } from '../modules/connectors/connected-accounts.service';

@Injectable()
export class TokenRefreshWorker {
  private readonly logger = new Logger(TokenRefreshWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connectorFactory: ConnectorFactory,
    private readonly connectedAccounts: ConnectedAccountsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async refreshExpiringTokens() {
    const threshold = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const accounts = await this.prisma.connectedAccount.findMany({
      where: {
        deletedAt: null,
        status: { not: AccountStatus.ERROR },
        tokenExpiresAt: { not: null, lte: threshold },
        refreshToken: { not: null },
      },
      select: { id: true, platform: true },
    });

    if (accounts.length === 0) return;

    this.logger.log(`Refreshing ${accounts.length} expiring token(s)`);

    await Promise.allSettled(
      accounts.map((a: { id: string; platform: string }) =>
        this.refreshOne(a.id, a.platform as Platform),
      ),
    );
  }

  private async refreshOne(accountId: string, platform: Platform) {
    try {
      const decrypted =
        await this.connectedAccounts.getDecryptedAccountById(accountId);

      const connector = this.connectorFactory.getConnector(platform);
      const refreshed = await connector.refreshToken(
        decrypted as Parameters<typeof connector.refreshToken>[0],
      );

      await this.connectedAccounts.updateTokens(
        accountId,
        refreshed.accessToken,
        refreshed.refreshToken,
        refreshed.tokenExpiresAt,
      );

      this.logger.log(`Token refreshed for account ${accountId} (${platform})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to refresh token for account ${accountId}: ${message}`,
      );

      await this.connectedAccounts.updateStatus(
        accountId,
        AccountStatus.ERROR,
        `Token refresh failed: ${message}`,
      );
    }
  }
}
