import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';

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

  constructor(title: string, description: string) {
    this.title = title;
    this.description = description;
  }
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}
