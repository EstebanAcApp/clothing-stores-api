import { Controller, Get, Post, Body, Patch, Param, Delete, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

import { CustomersService } from './customers.service';

import { Customer } from 'src/shared/decorators/customer.decorator';
import { CurrentAccount } from 'src/auth/decorators/current-user.decorator';

import { type CustomerPayload } from 'src/common/types/express';

@Customer()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Get('me')
  getSelfData(
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.customersService.getSelfData(customer.id);
  }

  @Get('orders')
  getSelfOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.customersService.getSelfOrders(customer.id, page, limit);
  }

  @Get('orders/:id')
  getSelfOrderById(
    @Param('id') id: string,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.customersService.getSelfOrderById(id, customer.id);
  }

  @Patch('me')
  updateCustomer(
    @Body() dto: UpdateCustomerDto,
    @CurrentAccount() customer: CustomerPayload,
  ) {
    return this.customersService.updateCustomer(customer.id, dto);
  }
}
