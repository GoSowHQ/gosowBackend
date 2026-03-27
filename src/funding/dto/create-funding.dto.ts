import { IsNumber, IsUUID, IsOptional, IsBoolean, IsString, MaxLength, Min } from 'class-validator';

export class CreateFundingDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsUUID()
  projectId: string;

  @IsUUID()
  @IsOptional()
  rewardId?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsString()
  provider?: 'STRIPE' | 'INTERSWITCH';
}
