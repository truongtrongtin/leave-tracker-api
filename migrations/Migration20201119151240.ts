import { Migration } from '@mikro-orm/migrations';

export class Migration20201119151240 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" serial primary key, "email" varchar(255) not null, "password" varchar(255) not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');
    this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');

    this.addSql('create table "task" ("id" serial primary key, "title" varchar(255) null, "description" varchar(255) null, "status" text check ("status" in (\'OPEN\', \'IN_PROGRESS\', \'DONE\')) not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');
  }

}
