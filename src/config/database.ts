import { Dialect } from 'sequelize';

export type DbEnvironment = 'development' | 'test';

export type DbConfig = {
  [key in DbEnvironment]: {
    username: string;
    password: string;
    host: string;
    port: number;
    database: string;
    dialect: Dialect;
  };
};

const development: DbConfig['development'] = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434'),
  database: process.env.DB_DATABASE || 'postgres',
  dialect: 'postgres',
};

const test: DbConfig['test'] = {
  username: process.env.DB_TEST_USERNAME || 'postgres',
  password: process.env.DB_TEST_PASSWORD || 'postgres',
  host: process.env.DB_TEST_HOST || 'localhost',
  port: parseInt(process.env.DB_TEST_PORT || '5433'),
  database: process.env.DB_TEST_DATABASE || 'postgres',
  dialect: 'postgres',
};

const config: DbConfig = {
  development,
  test,
};

export default config;
