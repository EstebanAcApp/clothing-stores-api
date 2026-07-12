import { Transform } from "class-transformer";
import { IsHexColor, IsNotEmpty, IsString } from "class-validator";

export class CreateColorDto {
    @IsNotEmpty({message: 'The name of the color is required'})
    @IsString()
    @Transform(({value}) => typeof value === 'string' ? value.trim() : value)
    name!: string;

    @IsHexColor({message: 'The color format is invalid'})
    @IsNotEmpty({message: 'The Hex Code is required'})
    @IsString()
    @Transform(({value}) => typeof value === 'string' ? value.trim() : value)
    hexCode!: string;
}
