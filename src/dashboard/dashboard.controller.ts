import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe, Param } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

import { Staff } from 'src/shared/decorators/staff.decorator';
import { Roles } from 'src/shared/decorators/roles.decorator';

import { CurrentAccount } from 'src/auth/decorators/current-user.decorator';
import { type StaffPayload } from 'src/common/types/express';

@Staff()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('products')
  getProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('categoryId') categoryId?: string,
    @Query('colorId') colorId?: string,
    @Query('sizeId') sizeId?: string,
  ) {
    return this.dashboardService.getProducts(page, limit, categoryId, colorId, sizeId);
  }

  @Get('products/:id')
  getProductById(
    @Param('id') id: string,
  ) {
    return this.dashboardService.getProductById(id);
  }

  @Get('orders')
  getOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getOrders(page, limit);
  }

  @Get('orders/:id')
  getOrderbyId(
    @Param('id') id: string,
  ) {
    return this.dashboardService.getOrderbyId(id);
  }

  @Roles('OWNER', 'MANAGER')
  @Get('users')
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentAccount() staff: StaffPayload,
  ) {
    return this.dashboardService.getUsers(staff.id, page, limit);
  }
}
