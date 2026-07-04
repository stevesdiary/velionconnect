import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgRole } from '@velion/types';
import { Request } from 'express';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload; orgRole?: OrgRole }>();
    const userOrgRole = request.orgRole;
    if (!userOrgRole) return false;

    const roleHierarchy: Record<OrgRole, number> = {
      [OrgRole.OWNER]: 4,
      [OrgRole.ADMIN]: 3,
      [OrgRole.MEMBER]: 2,
      [OrgRole.VIEWER]: 1,
    };

    const userLevel = roleHierarchy[userOrgRole] ?? 0;
    return requiredRoles.some(
      (role) => userLevel >= (roleHierarchy[role] ?? 0),
    );
  }
}
