import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { AwsModule } from './aws/aws.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';

import { AuthGuard } from './auth/guards/auth/auth.guard';
import { RolesGuard } from './shared/guards/roles/roles.guard';
import { StaffGuard } from './shared/guards/staff/staff.guard';
import { CustomerGuard } from './shared/guards/customer/customer.guard';
import { DashboardModule } from './dashboard/dashboard.module';
import { CustomersModule } from './customers/customers.module';
import { ColorsModule } from './colors/colors.module';
import { SizesModule } from './sizes/sizes.module';
import { CategoriesModule } from './categories/categories.module';
import { VariantsModule } from './variants/variants.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    AwsModule,
    PaymentsModule,
    OrdersModule,
    DashboardModule,
    CustomersModule,
    ColorsModule,
    SizesModule,
    CategoriesModule,
    VariantsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: StaffGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomerGuard,
    },
  ],
})
export class AppModule { }
