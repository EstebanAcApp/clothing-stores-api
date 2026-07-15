import { Controller, Post, Body, Patch, Param, Delete, Query, Get, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadProductImageDto, ConfirmUploadProductImageDto, DeleteMenuItemImageDto } from './dto/product-image.dto'

import { ProductsService } from './products.service';

import { Roles } from 'src/shared/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Public()
  @Get()
  getProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit : number,
    @Query('categoryId') categoryId?: string,
    @Query('colorId') colorId?: string,
    @Query('sizeId') sizeId?: string,
  ) {
    return this.productsService.getProducts(page, limit, categoryId, colorId, sizeId);
  }

  @Public()
  @Get(':id')
  getProductById(
    @Param('id') id: string,
  ) {
    return this.productsService.getProductById(id);
  }

  @Roles('OWNER', 'MANAGER')
  @Post()
  createProduct(
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.createProduct(dto);
  }

  @Roles('OWNER', 'MANAGER')
  @Patch(':id')
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  @Roles('OWNER', 'MANAGER')
  @Delete(':id')
  deleteProduct(
    @Param('id') id: string,
  ) {
    return this.productsService.deleteProduct(id);
  }

  @Roles('OWNER', 'MANAGER')
  @Post(':id/image')
  getProductImageUploadUrl(
    @Param('id') id: string,
    @Body() dto: UploadProductImageDto,
  ) {
    return this.productsService.getProductImageUploadUrl(id, dto);
  }

  @Roles('OWNER', 'MANAGER')
  @Post(':id/image/confirm')
  confirmUploadProductImage(
    @Param('id') id: string,
    @Body() dto: ConfirmUploadProductImageDto,
  ) {
    return this.productsService.confirmUploadProductImage(id, dto);
  }

  @Roles('OWNER', 'MANAGER')
  @Delete(':id/image')
  deleteProductImage(
    @Param('id') id: string,
    @Body() dto: DeleteMenuItemImageDto,
  ) {
    return this.productsService.deleteProductImage(id, dto);
  }
}
