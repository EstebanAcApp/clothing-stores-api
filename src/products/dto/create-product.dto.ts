import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from "class-validator";
import { ProductStatus } from "generated/prisma/enums";

export class CreateProductDto {
    @IsNotEmpty({ message: 'The name of the product is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    name!: string;

    @IsNotEmpty({ message: 'The description of the product is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    description!: string;

    @Min(0, { message: 'The price cannot be less than 0' })
    @IsInt({ message: 'The price must be a whole number' })
    price!: number;

    @IsNotEmpty({ message: 'The status of the menu item is required' })
    @IsEnum(ProductStatus, { message: 'The status of the menu item is invalid' })
    status!: ProductStatus;

    @IsNotEmpty({ message: 'The category ID is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    categoryId!: string;
}