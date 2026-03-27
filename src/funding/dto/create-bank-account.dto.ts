import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @Length(10, 10)
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
