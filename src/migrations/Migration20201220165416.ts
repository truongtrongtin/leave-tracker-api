import { Migration } from '@mikro-orm/migrations';

export class Migration20201220165416 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" rename column "password" to "hashed_password";');


    this.addSql('alter table "user" rename column "password" to "current_hashed_refresh_token";');
  }

}
