import { Migration } from '@mikro-orm/migrations';

export class Migration20210105152849 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "first_name" varchar(255) not null, add column "last_name" varchar(255) not null;');
  }

}
