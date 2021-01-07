import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from '../base.entity';
import { User } from '../users/user.entity';

@Entity()
export class Leave extends BaseEntity {
  @Property()
  startAt: Date;

  @Property()
  endAt: Date;

  @Property()
  reason: string;

  @Enum(() => LeaveStatus)
  status: LeaveStatus = LeaveStatus.PENDING;

  @ManyToOne(() => User)
  user: User;

  constructor({
    user,
    startAt,
    endAt,
    reason,
  }: {
    user: User;
    startAt: Date;
    endAt: Date;
    reason: string;
  }) {
    super();
    this.reason = reason;
    this.startAt = startAt;
    this.endAt = endAt;
    this.user = user;
  }
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
}
