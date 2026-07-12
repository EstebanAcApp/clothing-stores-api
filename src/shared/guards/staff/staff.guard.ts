import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { IS_STAFF_KEY } from 'src/shared/decorators/staff.decorator';

@Injectable()
export class StaffGuard implements CanActivate {
  constructor (
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const isStaff = this.reflector.getAllAndOverride<boolean>(IS_STAFF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isStaff) return true;

    const { account } = context.switchToHttp().getRequest<Request>();

    if (account?.accountType !== 'staff') {
      throw new ForbiddenException('Your account type cannot perform this action');
    }

    if (account.status !== 'ACTIVE') {
      throw new ForbiddenException('The account is not active');
    }

    return true;
  }
}
