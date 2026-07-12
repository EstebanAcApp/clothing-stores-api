import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) { }

  async canActivate(
    context: ExecutionContext
  ): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('Token required');
    }

    let payload: any;

    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid Token');
    }

    if (payload.accountType === 'staff') {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid user');
      }

      const validDevice = await this.prisma.device.findFirst({
        where: {
          id: payload.device.id,
          userId: payload.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!validDevice) {
        throw new UnauthorizedException('Invalid device');
      }

      request['account'] = {
        ...user,
        deviceId: validDevice.id,
        accountType: 'staff',
      };
    } else if (payload.accountType === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.customer.id },
        select: {
          id: true,
          email: true,
          userName: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          status: true,
        },
      });

      if (!customer) {
        throw new UnauthorizedException('Invalid customer');
      }

      request['account'] = {
        ...customer,
        accountType: 'customer',
      };
    } else {
      throw new UnauthorizedException('Invalid token type');
    }

    return true;
  }
}