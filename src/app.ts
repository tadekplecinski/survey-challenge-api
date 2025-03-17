import express, { Express } from 'express';
import cors from 'cors';

import environment from './config/environment.ts';
import errorsMiddleware from './middleware/errors.ts';
import routes from './controllers/index.ts';

export default class App {
  app: Express;

  constructor() {
    this.app = express();

    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.setRoutes();
  }

  setRoutes() {
    this.app.use('/v1', routes);
    this.app.use(errorsMiddleware);
  }

  listen() {
    const { port } = environment;
    this.app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  }
}
