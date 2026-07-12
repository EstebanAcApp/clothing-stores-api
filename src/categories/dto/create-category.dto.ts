import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateCategoryDto {
    @IsNotEmpty({ message: 'The name of the color is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    name!: string;

    @IsNotEmpty({ message: 'The name of the color is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    description!: string;
}
