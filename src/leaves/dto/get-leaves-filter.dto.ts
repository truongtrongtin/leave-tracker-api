import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class GetLeavesFilterDto {
  @IsOptional()
  limit?: number;

  @IsOptional()
  page?: number;

  @IsOptional()
  orderBy?: string;

  @IsOptional()
  order?: string;

  @IsOptional()
  reason?: string;

  @IsOptional()
  userId?: string;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  from?: Date;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  to?: Date;
}
