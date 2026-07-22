import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { ProcessOrderDto } from './dto/process-order.dto';

import { OrdersService } from './orders.service';

import { Customer } from 'src/shared/decorators/customer.decorator';

import { CurrentAccount } from 'src/auth/decorators/current-user.decorator';
import { type CustomerPayload } from 'src/common/types/express';

@Customer()
@Controller('orders/customer')
export class CustomerOrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get(':id/pay-data')
  getSelfOrderPaymentToken(
    @Param('id') id: string,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.ordersService.getSelfOrderPaymentToken(id, customer.id);
  }

  @Post()
  createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.ordersService.createOrder(customer, dto);
  }

  @Post(':id/process')
  processOrder(
    @Param('id') id: string,
    @Body() dto: ProcessOrderDto,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.ordersService.processOrder(id, customer.id, dto);
  }
}