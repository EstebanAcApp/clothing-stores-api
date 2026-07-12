import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import argon2 from 'argon2';

import { LoginUserDto, RegisterCustomerDto, LoginCustomerDto } from './dto/create-auth.dto';
import { UpdatePasswordDto } from './dto/update-auth.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) { }


  // Staff
  async loginUser(
    { email, password }: LoginUserDto,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
      },
    });

    if (!existingUser) {
      this.logger.warn(`Failed login attempt for the user with the email=${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await this.verifyPassword(existingUser.password, password);

    if (!validPassword) {
      this.logger.warn(`Invalid password attempt for the user with the email=${email}`);
      throw new UnauthorizedException('Invalid credentials')
    }

    const { password: _, ...user } = existingUser;

    const device = await this.prisma.device.create({
      data: { userId: user.id },
      select: {
        id: true,
      },
    });

    const tokenData = { user, device, accountType: 'staff' as const };
    const token = await this.jwt.signAsync(tokenData);

    this.logger.log(`User ${user.id} logged in from device=${device.id}`);

    return {
      token,
    };
  }

  async changeUserPassword(
    id: string,
    { currentPassword, newPassword }: UpdatePasswordDto,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        email: true,
        password: true,
      },
    });

    const isCurrentPasswordValid = await this.verifyPassword(user.password, currentPassword);

    if (!isCurrentPasswordValid) {
      this.logger.warn(`Invalid password attempt for email=${user.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isSamePassword = await this.verifyPassword(user.password, newPassword);

    if (isSamePassword) {
      throw new BadRequestException('New password cannot be the same as the current password');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id },
      data: { 
        password: hashedPassword,
        temporaryPassword: false,
      },
    });

    return { message: 'Password updated successfully' };
  }

  async logoutUser(
    userId: string,
    deviceId?: string,
  ) {
    try {
      await this.prisma.device.delete({
        where: {
          id: deviceId,
          userId,
        },
      });

      this.logger.log(`User ${userId} logged out from device ${deviceId}`);
    } catch (error: any) {
      this.logger.error(`Logout failed for userId=${userId}`, error.stack);
      this.prisma.handleError(error, 'Could not process logout');
    }
  }


  // Customer
  async registerCustomer(
    dto: RegisterCustomerDto,
  ) {
    try {
      const customer = await this.prisma.customer.create({
        data: {
          ...dto,
          password: await this.hashPassword(dto.password),
        },
        select: {
          id: true,
        },
      });

      const tokenData = { customer, accountType: 'customer' as const}
      const token = await this.jwt.signAsync(tokenData);

      this.logger.log(`Customer ${customer.id} created, logged in`);

      return {
        token,
      };
    } catch (error) {
      this.prisma.handleError(error, 'The customer already exists');
    }
  }

  async loginCustomer(
    { userName, password }: LoginCustomerDto
  ) {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { userName },
      select: {
        id: true,
        password: true,
      },
    });

    if (!existingCustomer) {
      this.logger.warn(`Failed login attempt for the customer with the username=${userName}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await this.verifyPassword(existingCustomer.password, password);

    if (!validPassword) {
      this.logger.warn(`Invalid password attempt for the customer with the username=${userName}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...customer } = existingCustomer;

    const tokenData = { customer, accountType: 'customer' as const}
    const token = await this.jwt.signAsync(tokenData);

    this.logger.log(`Customer ${customer.id} logged in`);

    return {
      token,
    };
  }

  async changeCustomerPassword(
    id: string,
    { currentPassword, newPassword }: UpdatePasswordDto,
  ) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id },
      select: {
        email: true,
        password: true,
      },
    });

    const isCurrentPasswordValid = await this.verifyPassword(customer.password, currentPassword);

    if (!isCurrentPasswordValid) {
      this.logger.warn(`Invalid password attempt for email=${customer.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isSamePassword = await this.verifyPassword(customer.password, newPassword);

    if (isSamePassword) {
      throw new BadRequestException('New password cannot be the same as the current password');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.customer.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async logoutCustomer(
    id: string,
  ) {
    this.logger.log(`Customer ${id} logged out`);
  }


  // Private methods
  private async hashPassword(
    plainPassword: string,
  ): Promise<string> {
    return await argon2.hash(plainPassword);
  }

  private async verifyPassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return await argon2.verify(hashedPassword, plainPassword);
  }
}
