import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '../user.entity';

export class UpdateUserDto {
  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  dateOfBirth?: Date;
}
