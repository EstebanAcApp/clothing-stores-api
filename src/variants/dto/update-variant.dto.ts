import { IsInt, Min } from 'class-validator';

export class UpdateVariantDto {
    @Min(0, { message: 'The stock must be at least 0' })
    @IsInt({message: 'The stock must be an integer'})
    stock!: number;
}
