import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { UserRole } from 'generated/prisma/enums';
import { ROLES_KEY } from 'src/shared/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) { }

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { account } = context.switchToHttp().getRequest<Request>();

    if (account?.accountType !== 'staff') {
      throw new ForbiddenException('Your account type cannot perform this action');
    }

    if (!requiredRoles.includes(account.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
