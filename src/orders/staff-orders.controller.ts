import { Body, Controller, Param, Patch, Post } from '@nestjs/common';

import { UpdateOrderDto } from './dto/update-order.dto';

import { OrdersService } from './orders.service';

import { Staff } from 'src/shared/decorators/staff.decorator';

@Staff()
@Controller('orders/staff')
export class StaffOrdersController {
  constructor(private readonly ordersService: OrdersService) { }
  
  @Patch(':id')
  updateOrder(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.updateOrder(id, dto);
  }

  @Post(':id/refund')
  refundOrder(
    @Param('id') id: string,
  ) {
    return this.ordersService.refundOrder(id);
  }
}