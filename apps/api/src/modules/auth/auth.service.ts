import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';

import { CryptoService } from '../../common/crypto.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        fullName: dto.fullName,
        passwordHash,
      },
    });

    return this.issueTokens(user.id, user.email, user.fullName);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!user?.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    if (user.totpEnabled) {
      const tempToken = this.issueTempToken(user.id, user.email);
      return { requiresTwoFactor: true as const, tempToken };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      requiresTwoFactor: false as const,
      ...(await this.issueTokens(user.id, user.email, user.fullName)),
    };
  }

  async verifyTotp(
    tempToken: string,
    code: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    let payload: JwtPayload & { type?: string };
    try {
      payload = this.jwtService.verify<JwtPayload & { type?: string }>(
        tempToken,
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.type !== 'totp_pending') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        totpSecret: true,
        totpEnabled: true,
      },
    });

    if (!user?.totpEnabled || !user.totpSecret) {
      throw new UnauthorizedException(
        'Two-factor authentication is not enabled',
      );
    }

    const secret = this.cryptoService.decrypt(user.totpSecret);
    const { valid: isValid } = verifySync({ secret, token: code });
    if (!isValid)
      throw new UnauthorizedException('Invalid authentication code');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(
      user.id,
      user.email,
      user.fullName,
      userAgent,
      ipAddress,
    );
  }

  async getTotpStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true },
    });
    return { enabled: user?.totpEnabled ?? false };
  }

  async setupTotp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new UnauthorizedException();

    const secret = generateSecret();
    const encryptedSecret = this.cryptoService.encrypt(secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: encryptedSecret, totpEnabled: false },
    });

    const otpauthUri = generateURI({
      issuer: 'VelionConnect',
      label: user.email,
      secret,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);

    return { qrCodeDataUrl, secret };
  }

  async enableTotp(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true },
    });

    if (!user?.totpSecret) {
      throw new BadRequestException(
        'Two-factor authentication setup not started. Call /auth/2fa/setup first.',
      );
    }
    if (user.totpEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    }

    const secret = this.cryptoService.decrypt(user.totpSecret);
    const { valid: isValid } = verifySync({ secret, token: code });
    if (!isValid)
      throw new UnauthorizedException('Invalid authentication code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });

    return { success: true };
  }

  async disableTotp(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true },
    });

    if (!user?.totpEnabled || !user.totpSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const secret = this.cryptoService.decrypt(user.totpSecret);
    const { valid: isValid } = verifySync({ secret, token: code });
    if (!isValid)
      throw new UnauthorizedException('Invalid authentication code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });

    return { success: true };
  }

  async refresh(refreshToken: string, userAgent?: string, ipAddress?: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const { user } = storedToken;
    return this.issueTokens(
      user.id,
      user.email,
      user.fullName,
      userAgent,
      ipAddress,
    );
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        timezone: true,
        locale: true,
        currency: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  private issueTempToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, type: 'totp_pending' },
      { expiresIn: '5m' },
    );
  }

  private async issueTokens(
    userId: string,
    email: string,
    fullName: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const payload: JwtPayload = { sub: userId, email, fullName };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenValue = randomBytes(40).toString('hex');
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '30d';
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

    if (refreshExpiresIn.endsWith('d')) {
      const days = parseInt(refreshExpiresIn, 10);
      refreshExpiresAt.setDate(new Date().getDate() + days);
    }

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt: refreshExpiresAt,
        userAgent,
        ipAddress,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }
}
