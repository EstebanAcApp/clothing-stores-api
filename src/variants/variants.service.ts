import { Injectable } from '@nestjs/common';

import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VariantsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async createVariant(
    productId: string,
    { stock, colorId, sizeId }: CreateVariantDto,
  ) {
    try {
      return await this.prisma.productVariant.create({
        data: {
          stock,
          productId,
          colorId,
          sizeId,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error creating the product variant');
    }
  }

  async updateVariant(
    id: string,
    { stock }: UpdateVariantDto,
  ) {
    try {
      return await this.prisma.productVariant.update({
        where: { id },
        data: { stock },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the product variant');
    }
  }

  async deleteVariant(
    id: string,
  ) {
    try {
      await this.prisma.productVariant.delete({
        where: { id },
      });

      return { id };
    } catch (error) {
      this.prisma.handleError(error, 'Error deleting the product variant');
    }
  }
}
