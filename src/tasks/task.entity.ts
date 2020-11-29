import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { User } from 'users/user.entity';

@Entity()
export class Task {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  title?: string;

  @Property({ nullable: true })
  description?: string;

  @Enum(() => TaskStatus)
  status: TaskStatus = TaskStatus.OPEN;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @ManyToOne(() => User)
  user: User;

  constructor(title: string, description: string, user: User) {
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
