import { Migration } from '@mikro-orm/migrations';

export class Migration20210903055007 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" drop constraint if exists "user_role_check";');
    this.addSql('alter table "user" alter column "role" type text using ("role"::text);');
    this.addSql('alter table "user" add constraint "user_role_check" check ("role" in (\'MEMBER\', \'ADMIN\'));');

    this.addSql('alter table "task" drop constraint if exists "task_status_check";');
    this.addSql('alter table "task" alter column "status" type text using ("status"::text);');
    this.addSql('alter table "task" add constraint "task_status_check" check ("status" in (\'OPEN\', \'IN_PROGRESS\', \'DONE\'));');
  }

}
