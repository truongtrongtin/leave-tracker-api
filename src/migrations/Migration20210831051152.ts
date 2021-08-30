import { Migration } from '@mikro-orm/migrations';

export class Migration20210831051152 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "deleted_at" timestamptz(0) null;');
  }

}
