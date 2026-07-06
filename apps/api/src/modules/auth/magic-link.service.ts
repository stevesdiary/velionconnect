import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';

import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class MagicLinkService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('SMTP_HOST') ?? 'localhost',
      port: parseInt(configService.get<string>('SMTP_PORT') ?? '1025', 10),
      auth: configService.get<string>('SMTP_USER')
        ? {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          }
        : undefined,
    });
  }

  async sendMagicLink(email: string) {
    let user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Auto-create user on magic link request — they'll complete profile later
      user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          fullName: email.split('@')[0] ?? email,
        },
      });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.magicLink.create({
      data: { token, userId: user.id, expiresAt },
    });

    const webUrl =
      this.configService.get<string>('app.webUrl') ?? 'http://localhost:3000';
    const magicUrl = `${webUrl}/magic-link/verify?token=${token}`;

    await this.transporter.sendMail({
      from:
        process.env['EMAIL_FROM'] ??
        'VelionConnect <noreply@velionconnect.com>',
      to: email,
      subject: 'Your VelionConnect login link',
      html: `
        <p>Click the link below to sign in. It expires in 15 minutes.</p>
        <a href="${magicUrl}">${magicUrl}</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }

  async verifyMagicLink(token: string) {
    const link = await this.prisma.magicLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!link || link.usedAt || link.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    await this.prisma.magicLink.update({
      where: { id: link.id },
      data: { usedAt: new Date() },
    });

    const { user } = link;
    if (!user.emailVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
    };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
