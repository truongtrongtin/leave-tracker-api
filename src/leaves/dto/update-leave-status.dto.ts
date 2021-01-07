import { IsEnum } from 'class-validator';
import { LeaveStatus } from '../leave.entity';

export class UpdateLeaveStatusDto {
  @IsEnum(LeaveStatus)
  status!: LeaveStatus;
}
