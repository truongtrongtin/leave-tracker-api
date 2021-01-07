import {
  BeforeCreate,
  Collection,
  Entity,
  Enum,
  OneToMany,
  Property,
  Unique,
} from '@mikro-orm/core';
import { ApiHideProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { Leave } from '../leaves/leave.entity';
import { BaseEntity } from '../base.entity';
import { Task } from '../tasks/task.entity';

@Entity()
export class User extends BaseEntity {
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
  hashedRefreshToken?: string;

  @OneToMany(() => Task, (task) => task.user)
  tasks = new Collection<Task>(this);

  @Enum(() => Role)
  role: Role = Role.MEMBER;

  @OneToMany(() => Leave, (leave) => leave.user)
  leaves = new Collection<Leave>(this);

  @Property({ nullable: true })
  avatar?: string;

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
    super();
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

export enum Role {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}
