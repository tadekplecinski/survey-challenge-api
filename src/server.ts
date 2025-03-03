import './config/index.js';
import Database from './database/index.ts';
import environment from './config/environment.ts';
import dbConfig from './config/database.js';

// (async () => {
try {
  const db = new Database(environment.nodeEnv, dbConfig);
  await db.connect();

  import('./app.ts').then((_app) => {
    const App = _app.default;
    const app = new App();
    app.listen();
  });
} catch (err) {
  console.log('err', err);

  console.error('Something went wrong when initializing the server.');
}
// })();
