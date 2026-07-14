import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentsStoreService } from 'src/payments/payments-store.service';

import { type CustomerPayload } from 'src/common/types/express';
import { Item } from 'src/common/interfaces/product.interface';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mp: PaymentsStoreService,
  ) { }

  // Customer
  async getOrdersByCustomer(
    customerId: string,
    page: number,
    limit: number
  ) {
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { customerId },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          status: true,
          total: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { customerId } }),
    ]);

    return {
      data: orders,
      meta: {
        totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
    };
  }

  async getSelfOrderById(
    id: string,
    customerId: string,
  ) {
    try {
      const order = await this.prisma.order.findFirstOrThrow({
        where: { id, customerId },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          status: true,
          total: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              productId: true,
            },
          },
        },
      });

      const productIds = [...new Set(order.items.map((i) => i.productId))]

      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
        },
      });
      
      return {
        order,
        products,
      };
    } catch (error) {
      this.prisma.handleError(error, 'Order not found');
    }
  }

  async getSelfOrderPaymentToken(
    id: string,
    customerId: string,
  ) {
    try {
      const order = await this.prisma.order.findFirstOrThrow({
        where: { id, customerId },
        select: {
          paymentId: true,
          status: true,
        },
      });

      if (order.status !== 'PENDING') {
        throw new ConflictException('It is not possible to obtain the payment token for this order');
      }

      const { client_token } = await this.mp.getOrder(order.paymentId);

      return { client_token };
    } catch (error) {
      this.prisma.handleError(error, 'The order does not exist');
    }
  }

  async createOrder(
    customer: CustomerPayload,
    dto: CreateOrderDto,
  ) {
    if (!dto.variants?.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    if (dto.variants.some((i) => i.quantity <= 0)) {
      throw new BadRequestException('Item quantity must be greater than 0');
    }

    const ids = [...new Set(dto.variants.map((i) => i.id))];

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        product: {
          select: {
            name: true,
            description: true,
            price: true,
            status: true,
          },
        },
        color: {
          select: {
            name: true,
          },
        },
        size: {
          select: {
            name: true,
          },
        },
        productId: true,
      },
    });

    if (variants.length !== ids.length) {
      throw new NotFoundException('One or more items do not exist');
    }

    const variantsMap = new Map(variants.map((m) => [m.id, m]));

    const inactiveProduct = variants.find((variant) => variant.product.status !== 'ACTIVE');
    if (inactiveProduct) {
      throw new ConflictException(`${inactiveProduct.product.name} is not active`);
    }

    let total = 0;

    const groupedVariants = Array.from(
      dto.variants.reduce((map, product) => {
        map.set(product.id, (map.get(product.id) ?? 0) + product.quantity);
        return map;
      }, new Map<string, number>())
    ).map(([id, quantity]) => ({ id, quantity }));

    const items: Item[] = groupedVariants.map((dtoItem) => {
      const variant = variantsMap.get(dtoItem.id)!;

      total += variant.product.price * dtoItem.quantity;

      return {
        title: variant.product.name,
        description: `Color: ${variant.color.name}, Talla: ${variant.size.name}`,
        unit_price: String(variant.product.price),
        quantity: dtoItem.quantity,
      };
    });

    const { id, client_token, external_reference } = await this.mp.createOrder(items, {
      // FIXME: Email test, switch to production.
      email: 'customer@testuser.com',
      first_name: customer.firstName,
      last_name: customer.lastName,
    });

    if (!id || !client_token || !external_reference) {
      throw new InternalServerErrorException('Error creating the order (MP)');
    }

    try {
      const order = await this.prisma.order.create({
        data: {
          id: external_reference,
          name: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone,
          address: customer.address,
          items: {
            create: groupedVariants.map((item) => ({
              quantity: item.quantity,
              price: variantsMap.get(item.id)!.product.price,
              productId: variantsMap.get(item.id)!.productId,
              productVariantId: item.id,
            })),
          },
          total,
          paymentId: id,
          customerId: customer.id,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          status: true,
          total: true,
          items: {
            select: {
              quantity: true,
              price: true,
              productVariant: {
                select: {
                  color: {
                    select: {
                      name: true,
                      hexCode: true,
                    },
                  },
                  size: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              productId: true,
            },
          },
        },
      });

      const productIds = [...new Set(order.items.map((i) => i.productId))]

      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
        },
      });

      return {
        order,
        products,
        client_token,
      };
    } catch (error) {
      await this.mp.cancelOrder(id);
      throw new InternalServerErrorException('Error creating the order');
    }
  }

  async cancelOrder(
    id: string,
    customerId: string,
  ) {
    try {
      return await this.prisma.order.update({
        where: { id, customerId },
        data: { status: 'CANCELLED' },
        select: {
          id: true,
          status: true,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the order');
    }
  }

  // Staff
  async getOrderbyId(
    id: string,
  ) {
    try {
      const order = await this.prisma.order.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          status: true,
          total: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              productId: true,
            },
          },
        },
      });

      const productIds = [...new Set(order.items.map((i) => i.productId))]

      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
        },
      });

      return {
        order,
        products,
      };
    } catch (error) {
      this.prisma.handleError(error, 'The order does not exist');
    }
  }

  async updateOrder(
    id: string,
    { status }: UpdateOrderDto,
  ) {
    try {
      return await this.prisma.order.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          status: true,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the order');
    }
  }

}
