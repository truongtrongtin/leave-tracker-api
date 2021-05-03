import { QueryOrder } from '@mikro-orm/core';
import { IsEnum, IsOptional } from 'class-validator';

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
}
