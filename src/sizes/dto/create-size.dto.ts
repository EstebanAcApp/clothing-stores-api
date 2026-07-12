import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateSizeDto {
    @IsNotEmpty({ message: 'The name of the size is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
    name!: string;
}
