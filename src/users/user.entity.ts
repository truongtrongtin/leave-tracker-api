import {
  BeforeCreate,
  Entity,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { ApiHideProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  email: string;

  @Property({ hidden: true })
  @ApiHideProperty()
  password: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  @BeforeCreate()
  async setPassword(): Promise<void> {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async checkPassword(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.password);
  }
}
