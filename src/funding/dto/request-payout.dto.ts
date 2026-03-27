import { IsInt, IsUUID, Min } from 'class-validator';

export class RequestPayoutDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  bankAccountId: string;

  @IsInt()
  @Min(1)
  amountMinor: number;
}
