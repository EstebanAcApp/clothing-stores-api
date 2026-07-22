import { Module } from '@nestjs/common';

import { PaymentsModule } from 'src/payments/payments.module';
import { ProductsModule } from 'src/products/products.module';

import { OrdersService } from './orders.service';

import { StaffOrdersController } from './staff-orders.controller';
import { CustomerOrdersController } from './customer-orders.controller';

@Module({
  imports: [PaymentsModule, ProductsModule],
  controllers: [StaffOrdersController, CustomerOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}