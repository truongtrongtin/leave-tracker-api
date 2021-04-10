import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLeaveDto {
  @Type(() => Date)
  @IsNotEmpty()
  @IsDate()
  startAt!: Date;

  @Type(() => Date)
  @IsNotEmpty()
  @IsDate()
  endAt!: Date;

  @IsOptional()
  reason?: string;

  @IsOptional()
  userId?: number;
}
