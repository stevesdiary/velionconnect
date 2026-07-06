import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccountStatus, Platform } from '@velion/types';

import { AuditService } from '../audit/audit.service';
import { CryptoService } from '../../common/crypto.service';
import { PrismaService } from '../../prisma/prisma.service';

import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';
import { ConnectOAuthDto } from './dto/connect-oauth.dto';
import { ConnectorFactory } from './connector.factory';

@Injectable()
export class ConnectedAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly connectorFactory: ConnectorFactory,
  ) {}

  async findAll(orgId: string) {
    const accounts = await this.prisma.connectedAccount.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
    return accounts.map((a) => this.sanitize(a));
  }

  async findById(orgId: string, id: string) {
    const account = await this.prisma.connectedAccount.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!account) throw new NotFoundException('Connected account not found');
    return this.sanitize(account);
  }

  async getDecryptedAccount(orgId: string, id: string) {
    const account = await this.prisma.connectedAccount.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!account) throw new NotFoundException('Connected account not found');
    return {
      ...account,
      accessToken: this.crypto.decrypt(account.accessToken),
      refreshToken: account.refreshToken
        ? this.crypto.decrypt(account.refreshToken)
        : null,
    };
  }

  async getDecryptedAccountById(id: string) {
    const account = await this.prisma.connectedAccount.findUnique({
      where: { id },
    });
    if (!account) throw new NotFoundException('Connected account not found');
    return {
      ...account,
      accessToken: this.crypto.decrypt(account.accessToken),
      refreshToken: account.refreshToken
        ? this.crypto.decrypt(account.refreshToken)
        : null,
    };
  }

  async findByPlatformAccountId(platform: Platform, platformAccountId: string) {
    return this.prisma.connectedAccount.findFirst({
      where: { platform, platformAccountId, deletedAt: null },
    });
  }

  async connectWhatsApp(
    orgId: string,
    userId: string,
    dto: ConnectWhatsAppDto,
  ) {
    // Verify the token works by calling the WA Business API
    const verifyRes = await fetch(
      `https://graph.facebook.com/v19.0/${dto.phoneNumberId}?access_token=${dto.accessToken}`,
    );
    if (!verifyRes.ok) {
      throw new Error('Invalid WhatsApp access token or phone number ID');
    }
    const phoneData = (await verifyRes.json()) as {
      id: string;
      display_phone_number?: string;
    };

    const account = await this.prisma.connectedAccount.upsert({
      where: {
        organizationId_platform_platformAccountId: {
          organizationId: orgId,
          platform: Platform.WHATSAPP,
          platformAccountId: dto.phoneNumberId,
        },
      },
      create: {
        organizationId: orgId,
        workspaceId: dto.workspaceId ?? null,
        platform: Platform.WHATSAPP,
        platformAccountId: dto.phoneNumberId,
        displayName: dto.displayName,
        username: phoneData.display_phone_number ?? null,
        status: AccountStatus.CONNECTED,
        accessToken: this.crypto.encrypt(dto.accessToken),
        scopes: ['whatsapp_business_messaging'],
        metadata: { phoneNumberId: dto.phoneNumberId },
      },
      update: {
        displayName: dto.displayName,
        accessToken: this.crypto.encrypt(dto.accessToken),
        status: AccountStatus.CONNECTED,
        errorMessage: null,
        deletedAt: null,
      },
    });

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'connected_account.created',
      entityType: 'ConnectedAccount',
      entityId: account.id,
      after: {
        platform: Platform.WHATSAPP,
        platformAccountId: dto.phoneNumberId,
      },
    });

    return this.sanitize(account);
  }

  async connectOAuth(
    orgId: string,
    userId: string,
    platform: Platform,
    dto: ConnectOAuthDto,
  ) {
    const connector = this.connectorFactory.getConnector(platform);
    const accountData = await connector.connect({
      code: dto.code,
      redirectUri: dto.redirectUri,
      state: dto.state,
    });

    const account = await this.prisma.connectedAccount.upsert({
      where: {
        organizationId_platform_platformAccountId: {
          organizationId: orgId,
          platform,
          platformAccountId: accountData.platformAccountId,
        },
      },
      create: {
        organizationId: orgId,
        workspaceId: dto.workspaceId ?? null,
        platform,
        platformAccountId: accountData.platformAccountId,
        displayName: accountData.displayName,
        username: accountData.username ?? null,
        avatarUrl: accountData.avatarUrl ?? null,
        status: AccountStatus.CONNECTED,
        accessToken: this.crypto.encrypt(accountData.accessToken),
        refreshToken: accountData.refreshToken
          ? this.crypto.encrypt(accountData.refreshToken)
          : null,
        tokenExpiresAt: accountData.tokenExpiresAt ?? null,
        scopes: accountData.scopes,
        metadata: accountData.metadata as Prisma.InputJsonValue,
      },
      update: {
        displayName: accountData.displayName,
        accessToken: this.crypto.encrypt(accountData.accessToken),
        refreshToken: accountData.refreshToken
          ? this.crypto.encrypt(accountData.refreshToken)
          : null,
        tokenExpiresAt: accountData.tokenExpiresAt ?? null,
        status: AccountStatus.CONNECTED,
        errorMessage: null,
        deletedAt: null,
      },
    });

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'connected_account.created',
      entityType: 'ConnectedAccount',
      entityId: account.id,
      after: { platform, platformAccountId: accountData.platformAccountId },
    });

    return this.sanitize(account);
  }

  async disconnect(orgId: string, id: string, userId: string) {
    const account = await this.prisma.connectedAccount.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!account) throw new NotFoundException('Connected account not found');

    await this.prisma.connectedAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      organizationId: orgId,
      userId,
      action: 'connected_account.disconnected',
      entityType: 'ConnectedAccount',
      entityId: id,
    });
  }

  async updateStatus(id: string, status: AccountStatus, errorMessage?: string) {
    await this.prisma.connectedAccount.update({
      where: { id },
      data: { status, errorMessage: errorMessage ?? null },
    });
  }

  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken?: string | null,
    tokenExpiresAt?: Date | null,
  ) {
    await this.prisma.connectedAccount.update({
      where: { id },
      data: {
        accessToken: this.crypto.encrypt(accessToken),
        refreshToken: refreshToken
          ? this.crypto.encrypt(refreshToken)
          : undefined,
        tokenExpiresAt: tokenExpiresAt,
        status: AccountStatus.CONNECTED,
        errorMessage: null,
      },
    });
  }

  private sanitize(account: {
    id: string;
    organizationId: string;
    workspaceId: string | null;
    platform: string;
    platformAccountId: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    status: string;
    accessToken: string;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
    scopes: string[];
    metadata: unknown;
    lastSyncAt: Date | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const { accessToken: _a, refreshToken: _r, ...safe } = account;
    return safe;
  }
}
