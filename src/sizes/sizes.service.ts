import { Injectable } from '@nestjs/common';

import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SizesService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async createSize(
    { name }: CreateSizeDto,
  ) {
    try {
      return await this.prisma.size.create({
        data: {
          name,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'This size already exists');
    }
  }

  async updateSize(
    id: string,
    { name }: UpdateSizeDto,
  ) {
    try {
      return await this.prisma.size.update({
        where: { id },
        data: {
          name,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the size');
    }
  }

  async deleteSize(
    id: string
  ) {
    try {
      await this.prisma.size.delete({
        where: { id },
      });

      return { id };
    } catch (error) {
      this.prisma.handleError(error, 'Error deleting the size');
    }
  }
}
