import './config/index.js';
import cls from 'cls-hooked';
import { Options, Sequelize } from 'sequelize';
import dbConfig from './config/database.js';
import { registerModels } from './models/index.js';

interface SequelizeOptions extends Options {
  database?: string;
  username?: string;
  password?: string;
}

try {
  const namespace = cls.createNamespace('transactions-namespace');
  Sequelize.useCLS(namespace);

  const connection = new Sequelize(dbConfig as SequelizeOptions);
  await connection.authenticate({ logging: false });

  console.log('Connection to the database established successfully');

  await registerModels(connection);

  import('./app.ts').then((_app) => {
    const App = _app.default;
    const app = new App();
    app.listen();
  });
} catch (err) {
  console.error('Something went wrong when initializing the server.');
}
