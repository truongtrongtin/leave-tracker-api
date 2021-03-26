import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateLeaveDto } from './create-leave.dto';

export class AdminCreateLeaveDto extends CreateLeaveDto {
  userId!: number;
}
