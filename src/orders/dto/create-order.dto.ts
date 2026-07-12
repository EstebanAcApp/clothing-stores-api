import { IsArray, IsString, IsNumber, IsPositive, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class OrderItemDto {
  @IsString()
  id!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  variants!: OrderItemDto[];
}