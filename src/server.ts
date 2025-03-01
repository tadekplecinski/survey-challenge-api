import './config/index.js';
import Database from './database/index.js';
import environment from './config/environment.js';
import dbConfig from './config/database.js';

(async () => {
  try {
    const db = new Database(environment.nodeEnv, dbConfig);
    await db.connect();

    // const App = require('./app').default;
    // const app = new App();
    // app.listen();
  } catch (err) {
    console.log('err', err);

    console.error('Something went wrong when initializing the server.');
  }
})();
