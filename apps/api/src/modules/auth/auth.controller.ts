import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestMagicLinkDto, VerifyMagicLinkDto } from './dto/magic-link.dto';
import { RegisterDto } from './dto/register.dto';
import { TotpCodeDto } from './dto/totp-code.dto';
import { VerifyTotpDto } from './dto/verify-totp.dto';
import { MagicLinkService } from './magic-link.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly magicLinkService: MagicLinkService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(dto);
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Registered successfully' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    if (result.requiresTwoFactor) {
      return { requiresTwoFactor: true, tempToken: result.tempToken };
    }
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { message: 'Logged in successfully' };
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTotp(
    @Body() dto: VerifyTotpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.verifyTotp(
      dto.tempToken,
      dto.code,
      req.headers['user-agent'],
      req.ip,
    );
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Two-factor authentication verified' };
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  async getTotpStatus(@CurrentUser() user: JwtPayload) {
    return this.authService.getTotpStatus(user.sub);
  }

  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async setupTotp(@CurrentUser() user: JwtPayload) {
    return this.authService.setupTotp(user.sub);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async enableTotp(@CurrentUser() user: JwtPayload, @Body() dto: TotpCodeDto) {
    return this.authService.enableTotp(user.sub, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async disableTotp(@CurrentUser() user: JwtPayload, @Body() dto: TotpCodeDto) {
    return this.authService.disableTotp(user.sub, dto.code);
  }

  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    await this.magicLinkService.sendMagicLink(dto.email);
    return { message: 'Magic link sent if account exists' };
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(
    @Body() dto: VerifyMagicLinkDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.magicLinkService.verifyMagicLink(
      dto.token,
    );
    res.cookie('access_token', accessToken, this.cookieOptions(15 * 60));
    return { message: 'Verified successfully' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;
    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token' });
      return;
    }
    const tokens = await this.authService.refresh(
      refreshToken,
      req.headers['user-agent'],
      req.ip,
    );
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Refreshed successfully' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;
    if (refreshToken) await this.authService.logout(refreshToken);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  private cookieOptions(maxAgeSeconds: number): Record<string, unknown> {
    return {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: maxAgeSeconds * 1000,
    };
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, this.cookieOptions(15 * 60));
    res.cookie(
      'refresh_token',
      refreshToken,
      this.cookieOptions(30 * 24 * 60 * 60),
    );
  }
}
