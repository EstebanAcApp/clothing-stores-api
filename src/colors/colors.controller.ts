import { Controller, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

import { ColorsService } from './colors.service';

import { Staff } from 'src/shared/decorators/staff.decorator';
import { Roles } from 'src/shared/decorators/roles.decorator';

@Staff()
@Roles('OWNER', 'MANAGER')
@Controller('colors')
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) {}

  @Post()
  createColor(
    @Body() dto: CreateColorDto
  ) {
    return this.colorsService.createColor(dto);
  }

  @Patch(':id')
  updateColor(
    @Param('id') id: string,
    @Body() dto: UpdateColorDto,
  ) {
    return this.colorsService.updateColor(id, dto);
  }

  @Delete(':id')
  deleteColor(
    @Param('id') id: string,
  ) {
    return this.colorsService.deleteColor(id);
  }
}
