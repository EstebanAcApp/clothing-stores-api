import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Courier } from "generated/prisma/enums";

export class UpdateOrderDto {
    @IsEnum(Courier, { message: 'The courier is invalid' })
    @IsNotEmpty({ message: 'The courier is required' })
    @IsString()
    courier!: Courier;

    @IsNotEmpty({ message: 'The courier is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    deliveryGuide!: string;
}
