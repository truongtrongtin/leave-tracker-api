import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';

export class CreateLeaveDto {
  @Type(() => Date)
  @IsNotEmpty()
  @IsDate()
  startAt!: Date;

  @Type(() => Date)
  @IsNotEmpty()
  @IsDate()
  endAt!: Date;

  @IsNotEmpty()
  reason!: string;
}
