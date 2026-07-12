import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";

import { UserRole, UserStatus } from "generated/prisma/enums";

export class CreateUserDto {
    @IsEmail({}, { message: 'The email is invalid' })
    @IsNotEmpty({ message: 'The email is required' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    email!: string;

    @IsNotEmpty({message: 'The name is required'})
    @IsString({ message: 'The name must be a string' })
    @Transform(({value}) => typeof value === 'string' ? value.trim() : value)
    name!: string;

    @IsEnum(UserRole, {message: 'Invalid user role'})
    @IsNotEmpty({ message: 'The user role is required' })
    role!: UserRole;

    @IsEnum(UserStatus, {message: 'Invalid user status'})
    @IsNotEmpty({ message: 'The user status is required' })
    status!: UserStatus;
}