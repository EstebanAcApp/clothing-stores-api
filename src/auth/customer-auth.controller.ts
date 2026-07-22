import { Controller, Post, Body, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { type Response } from 'express';

import { RegisterCustomerDto, LoginCustomerDto } from './dto/create-auth.dto';
import { UpdatePasswordDto } from './dto/update-auth.dto';

import { AuthService } from './auth.service';
import { AlreadyAuthenticatedGuard } from './guards/already-authenticated.guard';

import { Public } from './decorators/public.decorator';
import { Customer } from 'src/shared/decorators/customer.decorator';
import { CurrentAccount } from './decorators/current-user.decorator';

import { type CustomerPayload } from 'src/common/types/express';

import { setAuthCookie, clearAuthCookie } from './helpers/cookie.helper';

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