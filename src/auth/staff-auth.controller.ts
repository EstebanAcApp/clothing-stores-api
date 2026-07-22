import { Controller, Post, Body, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { type Response } from 'express';

import { LoginUserDto } from './dto/create-auth.dto';
import { UpdatePasswordDto } from './dto/update-auth.dto';

import { AuthService } from './auth.service';
import { AlreadyAuthenticatedGuard } from './guards/already-authenticated.guard';

import { Public } from './decorators/public.decorator';
import { Staff } from 'src/shared/decorators/staff.decorator';
import { CurrentAccount } from './decorators/current-user.decorator';

import { type StaffPayload } from 'src/common/types/express';

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