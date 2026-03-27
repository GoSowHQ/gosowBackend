import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  goalAmount: number;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  rewards?: {
    title: string;
    amount: number;
    description: string;
  }[];
}
