import { Options } from '@mikro-orm/core';
// https://github.com/mikro-orm/mikro-orm/issues/354
import 'tsconfig-paths/register';

const mikroOrmConfig: Options = {
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  dbName: process.env.DATABASE_NAME,
  type: 'postgresql',
  host: 'postgres',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  debug: true,
  migrations: {
    path: './src/migrations',
  },
};

export default mikroOrmConfig;
