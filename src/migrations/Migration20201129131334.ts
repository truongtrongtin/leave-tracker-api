import { Migration } from '@mikro-orm/migrations';

export class Migration20201129131334 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "task" add column "user_id" int4 not null;');

    this.addSql('alter table "task" add constraint "task_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;');
  }

}
