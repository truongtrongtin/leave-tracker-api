import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from '../base.entity';
import { User } from '../users/user.entity';

@Entity()
export class Task extends BaseEntity {
  @Property({ nullable: true })
  title?: string;

  @Property({ nullable: true })
  description?: string;

  @Enum(() => TaskStatus)
  status: TaskStatus = TaskStatus.OPEN;

  @ManyToOne(() => User)
  user: User;

  constructor({
    title,
    description,
    user,
  }: {
    title: string;
    description: string;
    user: User;
  }) {
    super();
    this.title = title;
    this.description = description;
    this.user = user;
  }
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}
