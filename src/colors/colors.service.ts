import { Injectable } from '@nestjs/common';

import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ColorsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async createColor(
    { name, hexCode }: CreateColorDto
  ) {
    try {
      return await this.prisma.color.create({
        data: {
          name,
          hexCode,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'This color name is already in use');
    }
  }

  async updateColor(
    id: string,
    { name, hexCode }: UpdateColorDto,
  ) {
    try {
      return await this.prisma.color.update({
        where: { id },
        data: {
          name,
          hexCode,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating the color');
    }
  }

  async deleteColor(
    id: string,
  ) {
    try {
      await this.prisma.color.delete({
        where: { id },
      });

      return { id };
    } catch (error) {
      this.prisma.handleError(error, 'Error deleting the color');
    }
  }
}
