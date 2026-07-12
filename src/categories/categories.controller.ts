import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { CategoriesService } from './categories.service';

import { Staff } from 'src/shared/decorators/staff.decorator';
import { Roles } from 'src/shared/decorators/roles.decorator';

@Staff()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles('OWNER', 'MANAGER')
  @Post()
  createCategory(
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.createCategory(dto);
  }

  @Roles('OWNER', 'MANAGER')
  @Patch(':id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Roles('OWNER', 'MANAGER')
  @Delete(':id')
  deleteCategory(
    @Param('id') id: string,
  ) {
    return this.categoriesService.deleteCategory(id);
  }

}
