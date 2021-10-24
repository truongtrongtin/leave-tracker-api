import { QueryOrder } from '@mikro-orm/core';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';

export class GetLeavesFilterDto {
  @IsOptional()
  limit?: number;

  @IsOptional()
  page?: number;

  @IsOptional()
  orderBy?: string;

  @IsOptional()
  @IsEnum(QueryOrder)
  order?: QueryOrder;

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
