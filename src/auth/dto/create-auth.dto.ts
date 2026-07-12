import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";

// Staff
export class LoginUserDto {
    @IsEmail({}, { message: 'The email is invalid' })
    @IsNotEmpty({ message: 'The email is required' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    email!: string;

    @MaxLength(128, { message: 'Invalid credentials' })
    @IsString()
    password!: string;
}

// Customer
export class RegisterCustomerDto {
    @IsEmail({}, { message: 'The email is invalid' })
    @IsNotEmpty({ message: 'The email is required' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    email!: string;

    @MaxLength(20, { message: 'The maximum username length is 20 characters' })
    @MinLength(5, { message: 'The minimum username length is 5 characters' })
    @IsNotEmpty({ message: 'The username is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim().replaceAll(' ', '') : value)
    userName!: string;

    // Following NIST guidelines
    @Matches(/^(?!(.)\1+$).+$/, { message: 'The password cannot consist of the same repeated character' })
    @Matches(/\S/, { message: 'The password cannot consist of only spaces' })
    @MaxLength(128, { message: 'The password cannot exceed 128 characters' })
    @MinLength(15, { message: 'The password must be at least 15 characters long' })
    @IsString({ message: 'The password must be a string' })
    password!: string;

    @IsNotEmpty({ message: 'The first name is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    firstName!: string;

    @IsNotEmpty({ message: 'The last name is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    lastName!: string;

    @Length(14, 14, { message: 'The phone is invalid' })
    @IsNotEmpty({ message: 'The first name is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    phone!: string;

    @IsNotEmpty({ message: 'The address is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    address!: string;
}

export class LoginCustomerDto {
    @IsNotEmpty({ message: 'The username is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    userName!: string;

    @MaxLength(128, { message: 'Invalid credentials' })
    @IsString()
    password!: string;
}