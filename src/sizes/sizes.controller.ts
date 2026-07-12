import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

import { SizesService } from './sizes.service';

import { Staff } from 'src/shared/decorators/staff.decorator';
import { Roles } from 'src/shared/decorators/roles.decorator';

@Staff()
@Roles('OWNER', 'MANAGER')
@Controller('sizes')
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  @Post()
  createSize(
    @Body() dto: CreateSizeDto,
  ) {
    return this.sizesService.createSize(dto);
  }

  @Patch(':id')
  updateSize(
    @Param('id') id: string,
    @Body() dto: UpdateSizeDto,
  ) {
    return this.sizesService.updateSize(id, dto);
  }

  @Delete(':id')
  deleteSize(
    @Param('id') id: string,
  ) {
    return this.sizesService.deleteSize(id);
  }
  
}
