import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Role } from '../user.entity';

export class UpdateUserDto {
  @IsNotEmpty()
  firstName!: string;

  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  currentPassword?: string;

  @IsOptional()
  password?: string;
}
