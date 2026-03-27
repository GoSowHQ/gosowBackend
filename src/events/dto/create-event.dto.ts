import { IsString, IsEnum, IsOptional, IsDateString, IsInt, IsArray, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  description: string;

  @IsEnum(EventType)
  type: EventType;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAttendees?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
