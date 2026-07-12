import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpdatePasswordDto {
    @MaxLength(128, { message: 'Invalid credentials' })
    @IsString({ message: 'The password must be a string' })
    currentPassword!: string;

    // Following NIST guidelines
    @Matches(/^(?!(.)\1+$).+$/, { message: 'The password cannot consist of the same repeated character' })
    @Matches(/\S/, { message: 'The password cannot consist of only spaces' })
    @MaxLength(128, { message: 'The password cannot exceed 128 characters' })
    @MinLength(15, { message: 'The password must be at least 15 characters long' })
    @IsString({ message: 'The password must be a string' })
    newPassword!: string;
}
