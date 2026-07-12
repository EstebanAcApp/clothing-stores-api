import { Controller, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

import { VariantsService } from './variants.service';

import { Staff } from 'src/shared/decorators/staff.decorator';
import { Roles } from 'src/shared/decorators/roles.decorator';

@Staff()
@Roles('OWNER', 'MANAGER')
@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post(':productId')
  createVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto
  ) {
    return this.variantsService.createVariant(productId, dto);
  }

  @Patch(':id')
  updateVariant(
    @Param('id') id: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.variantsService.updateVariant(id, dto);
  }
  
  @Delete(':id')
  deleteVariant(
    @Param('id') id: string,
  ) {
    return this.variantsService.deleteVariant(id);
  }
}
