import { Injectable } from '@nestjs/common';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async createCategory(
    { name, description }: CreateCategoryDto,
  ) {
    try {
      return await this.prisma.category.create({
        data: {
          name,
          description,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error creating the category');
    }
  }

  async updateCategory(
    id: string,
    { name, description }: UpdateCategoryDto,
  ) {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          name,
          description,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the category');
    }
  }

  async deleteCategory(
    id: string,
  ) {
    try {
      await this.prisma.category.delete({
        where: { id },
      });

      return { id };
    } catch (error) {
      this.prisma.handleError(error, 'You cannot delete the category; it contains products');
    }
  }
}
