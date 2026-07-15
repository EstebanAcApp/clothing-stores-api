import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

import { OrdersService } from './orders.service';

import { Customer } from 'src/shared/decorators/customer.decorator';
import { Staff } from 'src/shared/decorators/staff.decorator';

import { CurrentAccount } from 'src/auth/decorators/current-user.decorator';
import { type CustomerPayload } from 'src/common/types/express';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Customer()
  @Get(':id/pay-data')
  getSelfOrderPaymentToken(
    @Param('id') id: string,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.ordersService.getSelfOrderPaymentToken(id, customer.id);
  }

  @Customer()
  @Post()
  createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.ordersService.createOrder(customer, dto);
  }

  @Customer()
  @Patch(':id/cancel')
  cancelOrder(
    @Param('id') id: string,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.ordersService.cancelOrder(id, customer.id);
  }

  @Staff()
  @Patch(':id')
  updateOrder(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.updateOrder(id, dto);
  }
}
