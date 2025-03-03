import cls from 'cls-hooked';
import { Sequelize } from 'sequelize';

import { registerModels } from '../models/index.ts';

export default class Database {
  isTestEnvironment: boolean;
  connection?: Sequelize;

  constructor(
    private environment: 'development' | 'test',
    private dbConfig: any
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

    await registerModels(this.connection);
    await this.sync();
  }

  async disconnect() {
    await this.connection?.close();
  }

  async sync() {
    await this.connection?.sync({
      logging: false,
      // force: true,
    });

    // if (!this.isTestEnvironment) {
    //   console.log('Connection synced successfully');
    // }
  }
}
