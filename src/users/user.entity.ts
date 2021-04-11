import {
  BeforeCreate,
  BeforeUpdate,
  Collection,
  Entity,
  Enum,
  OneToMany,
  Property,
  Unique,
} from '@mikro-orm/core';
import { ApiHideProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { BaseEntity } from '../base.entity';
import { Leave } from '../leaves/leave.entity';
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
  password: string;

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

  @Property({ type: 'date', nullable: true })
  birthday?: Date;

  constructor({
    email,
    password,
    firstName,
    lastName,
    birthday,
  }: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthday?: Date;
  }) {
    super();
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthday = birthday;
  }

  async checkPassword(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.password);
  }
}

export enum Role {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}
