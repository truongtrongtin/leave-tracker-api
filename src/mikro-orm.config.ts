import { Options } from '@mikro-orm/core';

const mikroOrmConfig: Options = {
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  dbName: process.env.DATABASE_NAME,
  type: 'postgresql',
  host: 'postgres',
  port: 5432,
  user: 'postgres',
  password: process.env.DATABASE_PASSWORD,
  debug: true,
  migrations: { path: 'src/migrations' },
};

export default mikroOrmConfig;
