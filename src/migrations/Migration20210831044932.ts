import { Migration } from '@mikro-orm/migrations';

export class Migration20210831044932 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "email" varchar(255) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "password" varchar(255) not null, "hashed_refresh_token" varchar(255) null, "role" text check ("role" in (\'MEMBER\', \'ADMIN\')) not null, "avatar" varchar(255) null, "date_of_birth" timestamptz(0) null);');
    this.addSql('alter table "user" add constraint "user_pkey" primary key ("id");');
    this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');

    this.addSql('create table "task" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" varchar(255) null, "description" varchar(255) null, "status" text check ("status" in (\'OPEN\', \'IN_PROGRESS\', \'DONE\')) not null, "user_id" uuid not null);');
    this.addSql('alter table "task" add constraint "task_pkey" primary key ("id");');

    this.addSql('create table "leave" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "start_at" timestamptz(0) not null, "end_at" timestamptz(0) not null, "reason" varchar(255) null, "user_id" uuid not null);');
    this.addSql('alter table "leave" add constraint "leave_pkey" primary key ("id");');

    this.addSql('alter table "task" add constraint "task_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;');

    this.addSql('alter table "leave" add constraint "leave_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;');
  }

}
