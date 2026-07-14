import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { ProductsService } from 'src/products/products.service';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
  ) { }

  async getStats() {
    const [recentOrders, topProducts, totalSales, quantityOfProductsSold, ordersPendingDelivery, deliveredOrders] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { status: 'CONFIRMED' },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          total: true,
          status: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),
      this.prisma.order.aggregate({ where: { status: 'CONFIRMED' }, _sum: { total: true } }),
      this.prisma.orderItem.aggregate({ where: { order: { status: 'CONFIRMED' } }, _sum: { quantity: true } }),
      this.prisma.order.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
    ]);

    const productIds = topProducts.map(p => p.productId);
    const productsData = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        name: true,
        description: true,
        price: true,
        status: true,
        mediaKeys: true,
        variants: {
          select: {
            stock: true,
          },
        },
      },
    });

    const processedProducts = await Promise.all(
      productsData.map(async (product) => {
        let imageUrls: string[] = [];

        if (product.mediaKeys && product.mediaKeys.length > 0) {
          const firstMediaKey = product.mediaKeys[0];
          const { images } = await this.productsService.getImageUrls([firstMediaKey]);
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
      recentOrders,
      topProducts: processedProducts,
      totalSales: totalSales._sum.total === null ? 0 : totalSales._sum.total,
      quantityOfProductsSold: quantityOfProductsSold._sum.quantity === null ? 0 : quantityOfProductsSold._sum.quantity,
      ordersPendingDelivery,
      deliveredOrders,
    };
  }

  async getProducts(
    page: number,
    limit: number,
    categoryId?: string,
    colorId?: string,
    sizeId?: string,
  ) {
    const skip = (page - 1) * limit;

    const [products, categories, colors, sizes, activeProducts, inactiveProducts, totalCategories, totalProducts] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: {
          ...(categoryId && { categoryId }),
          ...((colorId || sizeId) && {
            variants: {
              some: {
                ...(colorId && { colorId }),
                ...(sizeId && { sizeId }),
              },
            },
          }),
        },
        include: {
          category: true,
          variants: {
            include: {
              color: true,
              size: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.category.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
      }),
      this.prisma.color.findMany({
        select: {
          id: true,
          name: true,
          hexCode: true,
        },
      }),
      this.prisma.size.findMany({
        select: {
          id: true,
          name: true,
        },
      }),
      this.prisma.product.count({ where: { status: 'ACTIVE' } }),
      this.prisma.product.count({ where: { status: 'INACTIVE' } }),
      this.prisma.category.count(),
      this.prisma.product.count({
        where: {
          ...(categoryId && { categoryId }),
        },
      }),
    ]);

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
      data: {
        products: processedProducts,
        categories,
        colors,
        sizes,
      },
      meta: {
        activeProducts,
        inactiveProducts,
        totalCategories,
        totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
      },
    };
  }

  async getProductById(
    id: string,
  ) {
    return await this.productsService.getProductById(id);
  }

  async getOrders(
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [orders, ordersPendingDelivery, deliveredOrders, cancelledOrders, totalOrders] = await this.prisma.$transaction([
      this.prisma.order.findMany({
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
      this.prisma.order.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
      this.prisma.order.count(),
    ]);

    return {
      data: orders,
      meta: {
        ordersPendingDelivery,
        deliveredOrders,
        cancelledOrders,
        totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
    };
  }

  async getOrderbyId(
    id: string,
  ) {
    return await this.ordersService.getOrderbyId(id);
  }

  async getUsers(
    selfId: string,
    page: number,
    limit: number,
  ) {
    return await this.usersService.getUsers(selfId, page, limit);
  }
}