import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadProductImageDto, ConfirmUploadProductImageDto, DeleteMenuItemImageDto } from './dto/product-image.dto'

import { PrismaService } from 'src/prisma/prisma.service';
import { AwsService } from 'src/aws/aws.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aws: AwsService,
  ) { }

  async getImageUrls(
    mediaKeys: string[],
  ) {
    let imageUrls: string[] = [];

    imageUrls = await Promise.all(
      mediaKeys.map(async (key) => await this.aws.getDownloadPresignedUrl(key))
    );


    return {
      images: imageUrls,
    };
  }

  async getProducts(
    page: number,
    limit: number,
    categoryId?: string,
    colorId?: string,
    sizeId?: string,
  ) {
    if (limit > 30) {
      throw new  BadRequestException('The maximum limit is 30 products');
    }
    
    const skip = (page - 1) * limit;

    const [products, categories, colors, sizes, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          variants: { some: { stock: { gte: 1 } } },
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
          const { images } = await this.getImageUrls([product.mediaKeys[0]]);
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
    try {
      const product = await this.prisma.product.findUniqueOrThrow({
        where: { id },
        include: {
          category: true,
          variants: {
            include: {
              color: true,
              size: true,
            },
          },
        },
      });

      if (product.mediaKeys && product.mediaKeys.length > 0) {
        const { images } = await this.getImageUrls(product.mediaKeys);

        const { mediaKeys, ...processedProducts } = product;

        return {
          ...processedProducts,
          images,
        };
      }

      const { mediaKeys, ...processedProducts } = product;

      return {
        ...processedProducts,
        images: [],
      };
    } catch (error) {
      this.prisma.handleError(error, 'Product not found');
    }

  }

  async createProduct(
    { name, description, price, status, categoryId }: CreateProductDto,
  ) {
    try {
      const product = await this.prisma.product.create({
        data: {
          name,
          description,
          price,
          status,
          categoryId,
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
      });

      return {
        ...product,
        images: [],
      };
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
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          status: true,
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

  async getProductImageUploadUrl(
    id: string,
    { fileName, mimeType }: UploadProductImageDto,
  ) {
    const { uploadUrl, key } = await this.aws.getUploadPresignedUrl(id, fileName, mimeType);

    return { uploadUrl, key };
  }

  async confirmUploadProductImage(
    id: string,
    { key }: ConfirmUploadProductImageDto,
  ) {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          mediaKeys: {
            push: key,
          },
        },
        select: {
          mediaKeys: true,
        },
      });

      if (product.mediaKeys && product.mediaKeys.length > 0) {
        const { images } = await this.getImageUrls(product.mediaKeys);

        return {
          images,
        };
      }

      return {
        images: [],
      };
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the menu item images')
    }
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
