import { Transform } from "class-transformer";
import { IsOptional, IsString, Length } from "class-validator";

export class UpdateCustomerDto {
    @IsOptional()
    @Length(13, 13, { message: 'The phone is invalid' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim().replaceAll(' ', '') : value)
    phone?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    address?: string;
}
