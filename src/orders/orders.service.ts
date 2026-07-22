import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentsStoreService } from 'src/payments/payments-store.service';

import { type CustomerPayload } from 'src/common/types/express';
import { Item } from 'src/common/interfaces/product.interface';

import { OrderStatus, Prisma } from 'generated/prisma/client';
import { ProcessOrderDto } from './dto/process-order.dto';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsStoreService: PaymentsStoreService,
    private readonly productsService: ProductsService,
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
          courier: true,
          deliveryGuide: true,
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
          mediaKeys: true,
        },
      });

      const processedProducts = await Promise.all(
        products.map(async (product) => {
          let imageUrls: string[] = [];

          if (product.mediaKeys && product.mediaKeys.length > 0) {
            const { images } = await this.productsService.getImageUrls([product.mediaKeys[0]]);
            imageUrls = images;
          }

          const { mediaKeys, ...productWithoutKeys } = product;

          return {
            ...productWithoutKeys,
            images: imageUrls,
          };
        })
      );

      return {
        order,
        products: processedProducts,
      };
    } catch (error) {
      this.prisma.handleError(error, 'Order not found');
    }
  }

  async getSelfOrderPaymentToken(
    orderId: string,
    customerId: string,
  ) {
    try {
      const order = await this.prisma.order.findFirstOrThrow({
        where: { id: orderId, customerId },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          status: true,
          total: true,
          paymentId: true,
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

      if (order.status !== 'PENDING') {
        throw new ConflictException('It is not possible to obtain the payment token for this order');
      }

      const EXPIRATION_MS = 20 * 60 * 1000;
      const elapsed = Date.now() - order.createdAt.getTime();

      if (elapsed > EXPIRATION_MS) {
        await this.paymentsStoreService.cancelOrder(order.paymentId);

        try {
          await this.prisma.order.update({
            where: { id: orderId, customerId },
            data: { status: 'CANCELLED' },
          });
        } catch (error) {
          this.prisma.handleError(error, 'Error updating the order status to CANCELLED')
        }

        throw new ConflictException('ORDER_EXPIRED');
      }

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

      const { id, client_token, external_reference, total_amount } = await this.paymentsStoreService.getOrder(order.paymentId);

      const { paymentId: _, ...orderWithoutPaymentId } = order;

      return {
        order: orderWithoutPaymentId,
        products,
        paymentData: {
          id,
          client_token,
          external_reference,
          total_amount,
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.prisma.handleError(error, 'The order does not exist');
      }
      throw error;
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

    const { id, client_token, external_reference } = await this.paymentsStoreService.createOrder(items, {
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

      return {
        id: order.id,
      };
    } catch (error) {
      console.log(error)
      await this.paymentsStoreService.cancelOrder(id);
      throw new InternalServerErrorException('Error creating the order');
    }
  }

  async processOrder(
    orderId: string,
    customerId: string,
    dto: ProcessOrderDto,
  ) {
    let orderAmount: number;
    let paymentId: string;
    let orderStatus: OrderStatus;

    try {
      const order = await this.prisma.order.findFirstOrThrow({
        where: { id: orderId, customerId },
        select: {
          total: true,
          paymentId: true,
          status: true,
        },
      });

      orderAmount = order.total;
      paymentId = order.paymentId;
      orderStatus = order.status;
    } catch (error) {
      this.prisma.handleError(error, 'Order not found')
    }

    if (orderStatus !== 'PENDING') {
      throw new ConflictException('The order is not in a pending status');
    }

    const { status, status_detail, payment_status, payment_status_detail } = await this.paymentsStoreService.processOrder(paymentId, orderAmount, dto);

    if (status === 'processed' && status_detail === 'accredited') {
      try {
        await this.prisma.order.update({
          where: { id: orderId, customerId },
          data: { status: 'CONFIRMED' },
        })
      } catch (error) {
        this.prisma.handleError(error, 'Error updating the order status to CONFIRMED');
      }
    }

    if (status === 'processing' && status_detail === 'in_process') {
      try {
        await this.prisma.order.update({
          where: { id: orderId, customerId },
          data: { status: 'PROCESSING' },
        })
      } catch (error) {
        this.prisma.handleError(error, 'Error updating the order status to PROCESSING');
      }
    }

    if (status === 'failed' || status === 'canceled' || status === 'expired') {
      try {
        await this.prisma.order.update({
          where: { id: orderId, customerId },
          data: { status: 'CANCELLED' },
        })
      } catch (error) {
        this.prisma.handleError(error, 'Error updating the order status to CANCELLED');
      }
    }

    return {
      status,
      status_detail,
      payment_status,
      payment_status_detail,
    };
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
          courier: true,
          deliveryGuide: true,
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
    { courier, deliveryGuide }: UpdateOrderDto,
  ) {
    try {
      return await this.prisma.order.update({
        where: { id },
        data: {
          courier,
          deliveryGuide,
          status: 'SHIPPED',
        },
        select: {
          id: true,
          courier: true,
          deliveryGuide: true,
          status: true,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the order');
    }
  }

  async refundOrder(
    id: string,
  ) {
    let total: number;
    let status: OrderStatus;
    let paymentId: string;

    const refundableStatuses: OrderStatus[] = ['CONFIRMED', 'SHIPPED', 'DELIVERED'];

    try {
      const order = await this.prisma.order.findUniqueOrThrow({
        where: { id },
        select: {
          total: true,
          status: true,
          paymentId: true,
        },
      });

      total = order.total;
      status = order.status;
      paymentId = order.paymentId;
    } catch (error) {
      this.prisma.handleError(error, 'Order not found');
    }

    if (!refundableStatuses.includes(status)) {
      throw new ConflictException(`Cannot refund an order with status ${status}`);
    }

    await this.paymentsStoreService.refundOrder(paymentId);

    try {
      await this.prisma.order.update({
        where: { id, paymentId },
        data: { status: 'REFUNDED' },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the order status to REFUNDED')
    }

    return {
      id,
      total,
      status: OrderStatus.REFUNDED,
    };
  }
}
