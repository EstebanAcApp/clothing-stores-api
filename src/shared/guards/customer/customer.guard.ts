import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { IS_CUSTOMER_KEY } from 'src/shared/decorators/customer.decorator';

@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) { }

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const isCustomer = this.reflector.getAllAndOverride<boolean>(IS_CUSTOMER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isCustomer) return true;

    const { account } = context.switchToHttp().getRequest<Request>();

    if (account?.accountType !== 'customer') {
      throw new ForbiddenException('Your account type cannot perform this action');
    }

    if (account.status !== 'ACTIVE') {
      throw new ForbiddenException('The account is not active');
    }

    return true;
  }
}
