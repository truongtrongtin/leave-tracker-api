import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateLeaveDto {
  @IsNotEmpty()
  @IsDateString()
  startAt!: Date;

  @IsNotEmpty()
  @IsDateString()
  endAt!: Date;

  @IsNotEmpty()
  reason!: string;
}
