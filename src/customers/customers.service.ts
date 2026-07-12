import { Injectable } from '@nestjs/common';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) { }

  async getSelfData(
    id: string,
  ) {
    return await this.prisma.customer.findUnique({
      where: { id },
      select: {
        email: true,
        userName: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
      },
    });
  }

  async getSelfOrders(
    id: string,
    page: number,
    limit: number,
  ) {
    return await this.ordersService.getOrdersByCustomer(id, page, limit);
  }

  async getSelfOrderById(
    id: string,
    customerId: string,
  ){
    return await this.ordersService.getSelfOrderById(id, customerId);
  }

  async updateCustomer(
    id: string,
    dto: UpdateCustomerDto,
  ) {
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: {

        },
        select: {
          email: true
        }
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating your data');
    }
  }
}
