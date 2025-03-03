import express, { Express } from 'express';
import environment from './config/environment.ts';
import errorsMiddleware from './middleware/errors.ts';
import { v1Routes } from './controllers/index.ts';

export default class App {
  app: Express;

  constructor() {
    this.app = express();

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.setRoutes();
  }

  setRoutes() {
    this.app.use('/v1', v1Routes);
    this.app.use(errorsMiddleware);
  }

  getApp() {
    return this.app;
  }

  listen() {
    const { port } = environment;
    this.app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  }
}
