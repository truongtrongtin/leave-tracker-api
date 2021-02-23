import { IsOptional } from 'class-validator';

export class GetLeavesFilterDto {
  @IsOptional()
  limit?: number;

  @IsOptional()
  page?: number;
}
