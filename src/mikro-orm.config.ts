import { Options } from '@mikro-orm/core';

const mikroOrmConfig: Options = {
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  type: 'postgresql',
  host: process.env.DATABASE_HOST,
  port: 5432,
  user: process.env.DATABASE_USER,
  dbName: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  debug: true,
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
    disableForeignKeys: false,
  },
};

export default mikroOrmConfig;
