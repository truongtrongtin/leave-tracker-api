import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from './mikro-orm.config';

(async () => {
  const orm = await MikroORM.init({
    ...mikroOrmConfig,
    migrations: {
      path: 'dist/migrations',
      pattern: /^[\w-]+\d+\.js$/,
    },
  });

  const migrator = orm.getMigrator();
  await migrator.up(); // runs migrations up to the latest
  await orm.close(true);
})();
