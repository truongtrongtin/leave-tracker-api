import { Options } from '@mikro-orm/core';

const mikroOrmConfig: Options = {
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  type: 'postgresql',
  ...(process.env.NODE_ENV === 'production' ? { host: 'postgres' } : {}),
  port: 5432,
  user: 'postgres',
  dbName: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  debug: true,
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
};

export default mikroOrmConfig;
