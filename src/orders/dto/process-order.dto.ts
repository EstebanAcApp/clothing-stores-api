import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class IdentificationDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;
}

export class PayerDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => IdentificationDto)
  identification?: IdentificationDto;
}

export class ProcessOrderDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsOptional()
  @IsString()
  issuer_id?: string;

  @IsString()
  @IsNotEmpty()
  payment_method_id!: string;

  @IsIn(['credit_card', 'debit_card'])
  payment_type!: string;

  @IsInt()
  @Min(1)
  installments!: number;

  @IsNumber()
  transaction_amount!: number;

  @ValidateNested()
  @Type(() => PayerDto)
  payer!: PayerDto;
}