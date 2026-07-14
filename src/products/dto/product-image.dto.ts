import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export enum AllowedImageMimeType {
    JPEG = 'image/jpeg',
    PNG = 'image/png',
}

export class UploadMenuItemImageDto {
    @MinLength(4, { message: 'The file name is invalid' })
    @IsNotEmpty({ message: 'The file name is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    fileName!: string;

    @IsEnum(AllowedImageMimeType, { message: 'Only .jpg, .jpeg and .png images are allowed' })
    @IsNotEmpty({ message: 'The mime type is required' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    mimeType!: string;
}

export class DeleteMenuItemImageDto {
    @IsNotEmpty({ message: 'The key is required' })
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    key!: string;
}