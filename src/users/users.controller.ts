import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { UsersService } from './users.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { Roles } from 'src/shared/decorators/roles.decorator';
import { Staff } from 'src/shared/decorators/staff.decorator';

import { CurrentAccount } from 'src/auth/decorators/current-user.decorator';
import { type StaffPayload } from 'src/common/types/express';

@Staff()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getSelfData(
    @CurrentAccount() staff: StaffPayload,
  ) {
    return this.usersService.getSelfData(staff.id);
  }

  @Roles('OWNER', 'MANAGER')
  @Post()
  createUser(
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createUser(dto);
  }

  @Roles('OWNER')
  @Patch(':userId')
  updateUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(userId, dto);
  }
  
  @Roles('OWNER')
  @Delete(':userId')
  deleteUser(
    @Param('userId') userId: string,
  ) {
    return this.usersService.deleteUser(userId);
  }
}
