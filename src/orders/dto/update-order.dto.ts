import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { OrderStatus } from "generated/prisma/enums";

export class UpdateOrderDto {
    @IsEnum(OrderStatus, {message: 'The status is invalid'})
    @IsNotEmpty({message: 'The status is required'})
    @IsString()
    status!: OrderStatus;
}
