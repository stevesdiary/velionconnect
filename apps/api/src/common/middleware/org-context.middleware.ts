import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';

import { JwtPayload } from '../decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrgContextMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async use(
    req: Request & { orgRole?: string; orgId?: string },
    _res: Response,
    next: NextFunction,
  ) {
    const orgSlug = req.params['orgSlug'];
    if (!orgSlug) return next();

    // Extract user from cookie or Authorization header
    const token =
      (req.cookies?.['access_token'] as string | undefined) ??
      req.headers['authorization']?.replace('Bearer ', '');

    if (!token) return next();

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      return next();
    }

    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId: payload.sub,
        organization: { slug: orgSlug, deletedAt: null },
      },
      select: { role: true, organizationId: true },
    });

    if (!membership)
      throw new UnauthorizedException('Not a member of this organization');

    req.orgRole = membership.role;
    req.orgId = membership.organizationId;
    next();
  }
}
