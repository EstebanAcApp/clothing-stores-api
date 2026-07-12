import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadMenuItemImageDto, DeleteMenuItemImageDto } from './dto/product-image.dto'

import { PrismaService } from 'src/prisma/prisma.service';
import { AwsService } from 'src/aws/aws.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aws: AwsService,
  ) { }

  async getProducts(
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [products, categories, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          variants: { some: { stock: { gte: 1 } } },
        },
        include: {
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
      this.prisma.product.count(),
    ]);

    return {
      data: {
        products,
        categories,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(
    id: string,
  ) {
    const item = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found in the menu');
    }

    return item;
  }

  async createProduct(
    { name, description, price, status, categoryId }: CreateProductDto,
  ) {
    try {
      return await this.prisma.product.create({
        data: {
          name,
          description,
          price,
          status,
          categoryId,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error creating the product');
    }
  }

  async updateProduct(
    id: string,
    { name, description, price, status }: UpdateProductDto,
  ) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          price,
          status,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the product')
    }
  }

  async deleteProduct(
    id: string,
  ) {
    try {
      await this.prisma.product.delete({
        where: { id },
      });

      return { id };
    } catch (error) {
      this.prisma.handleError(error, 'Error deleting product')
    }
  }

  async uploadProductImage(
    id: string,
    { fileName, mimeType }: UploadMenuItemImageDto,
  ) {
    const { uploadUrl, key } = await this.aws.getUploadPresignedUrl(id, fileName, mimeType);

    try {
      await this.prisma.product.update({
        where: { id },
        data: {
          mediaKeys: {
            push: key,
          },
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the menu item images')
    }

    return { uploadUrl, key };
  }

  async deleteProductImage(
    id: string,
    { key }: DeleteMenuItemImageDto,
  ) {
    const item = await this.prisma.product.findUnique({
      where: { id },
      select: {
        mediaKeys: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found in the menu');
    }

    if (!item.mediaKeys.includes(key)) {
      throw new NotFoundException(`Key ${key} not found in menu item`);
    }

    try {
      await this.prisma.product.update({
        where: { id },
        data: {
          mediaKeys: item.mediaKeys.filter(mediaKey => mediaKey !== key),
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error deleting the item image')
    }

    await this.aws.deleteObject(key);

    return { id, key };
  }
}
