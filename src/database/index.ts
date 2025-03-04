import cls from 'cls-hooked';
import { Sequelize } from 'sequelize';

import { registerModels } from '../models/index.js';

export default class Database {
  connection?: Sequelize;

  constructor(private dbConfig: any) {}

  async connect() {
    const namespace = cls.createNamespace('transactions-namespace');
    Sequelize.useCLS(namespace);

    this.connection = new Sequelize({
      ...this.dbConfig,
    });

    await this.connection.authenticate({ logging: false });

    console.log('Connection to the database established successfully');

    await registerModels(this.connection);
    await this.sync();
  }

  async disconnect() {
    await this.connection?.close();
  }

  async sync() {
    await this.connection?.sync({
      logging: false,
    });
  }
}
