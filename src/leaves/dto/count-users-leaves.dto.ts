import { IsOptional } from 'class-validator';

export class CountUsersLeavesDto {
  @IsOptional()
  year?: number;
}
