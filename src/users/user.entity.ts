import {
  BeforeCreate,
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { ApiHideProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { Task } from '../tasks/task.entity';

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  email: string;

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  @Property({ hidden: true })
  @ApiHideProperty()
  hashedPassword: string;

  @Property({ hidden: true, nullable: true })
  @ApiHideProperty()
  currentHashedRefreshToken?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OneToMany(() => Task, (task) => task.user, { hidden: true })
  tasks = new Collection<Task>(this);

  constructor({
    email,
    password,
    firstName,
    lastName,
  }: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    this.email = email;
    this.hashedPassword = password;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  @BeforeCreate()
  async setPassword(): Promise<void> {
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, 10);
  }

  async checkPassword(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.hashedPassword);
  }
}
