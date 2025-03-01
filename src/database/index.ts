import cls from 'cls-hooked';
import { Sequelize } from 'sequelize';

import { DbConfig } from '../config/database.js';
import { registerModels } from '../models/index.js';

export default class Database {
  isTestEnvironment: boolean;
  connection?: Sequelize;

  constructor(
    private environment: 'development' | 'test',
    private dbConfig: DbConfig
  ) {
    this.isTestEnvironment = this.environment === 'test';
  }

  async connect() {
    const namespace = cls.createNamespace('transactions-namespace');
    Sequelize.useCLS(namespace);

    this.connection = new Sequelize({
      ...this.dbConfig[this.environment],
      logging: this.isTestEnvironment ? false : console.log,
    });

    await this.connection.authenticate({ logging: false });

    if (!this.isTestEnvironment) {
      console.log('Connection to the database established successfully');
    }

    registerModels(this.connection);

    await this.sync();
  }

  async disconnect() {
    await this.connection?.close();
  }

  async sync() {
    await this.connection?.sync({
      logging: false,
      force: this.isTestEnvironment,
    });

    if (!this.isTestEnvironment) {
      console.log('Connection synced successfully');
    }
  }
}
