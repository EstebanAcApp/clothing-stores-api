import { Controller, Post, Body, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { type Response } from 'express';

import { LoginUserDto, RegisterCustomerDto, LoginCustomerDto } from './dto/create-auth.dto';
import { UpdatePasswordDto } from './dto/update-auth.dto';

import { AuthService } from './auth.service';
import { AlreadyAuthenticatedGuard } from './guards/already-authenticated.guard';

import { Public } from './decorators/public.decorator';
import { Staff } from 'src/shared/decorators/staff.decorator';
import { Customer } from 'src/shared/decorators/customer.decorator';
import { CurrentAccount } from './decorators/current-user.decorator';

import { type StaffPayload, type CustomerPayload } from 'src/common/types/express';

import { setAuthCookie, clearAuthCookie } from './helpers/cookie.helper';

@Controller('auth/staff')
export class StaffAuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Public()
  @UseGuards(AlreadyAuthenticatedGuard)
  @Post('login')
  async loginUser(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token } = await this.authService.loginUser(dto);
    setAuthCookie(res, token);
    return { message: 'Login Successful' };
  }

  @Staff()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutUser(
    @CurrentAccount() account: StaffPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutUser(account.id, account.deviceId);
    clearAuthCookie(res);
  }

  @Staff()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changeUserPassword(
    @CurrentAccount() user: StaffPayload,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.authService.changeUserPassword(user.id, dto);
  }
}

@Controller('auth/customer')
export class CustomerAuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Public()
  @UseGuards(AlreadyAuthenticatedGuard)
  @Post('register')
  async registerCustomer(
    @Body() dto: RegisterCustomerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token } = await this.authService.registerCustomer(dto);
    setAuthCookie(res, token);
    return { message: 'Login Successful' };
  }

  @Public()
  @UseGuards(AlreadyAuthenticatedGuard)
  @Post('login')
  async loginCustomer(
    @Body() dto: LoginCustomerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token } = await this.authService.loginCustomer(dto);
    setAuthCookie(res, token);
    return { message: 'Login Successful' };
  }

  @Customer()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutCustomer(
    @Res({ passthrough: true }) res: Response,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    await this.authService.logoutCustomer(customer.id);
    clearAuthCookie(res);
  }

  @Customer()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changeCustomerPassword(
    @Body() dto: UpdatePasswordDto,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.authService.changeCustomerPassword(customer.id, dto);
  }
}