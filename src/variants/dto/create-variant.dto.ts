import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateVariantDto {
    @Min(0, { message: 'The stock must be at least 0' })
    @IsInt({ message: 'The stock must be an integer' })
    stock!: number;

    @IsNotEmpty({ message: 'The color ID is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    colorId!: string;

    @IsNotEmpty({ message: 'The size ID is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    sizeId!: string;
}
