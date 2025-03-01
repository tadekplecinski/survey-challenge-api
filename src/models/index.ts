import { Sequelize, DataTypes, Model as SeqModel } from 'sequelize';
import { fileURLToPath } from 'node:url';
import { dirname, basename, join } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const basenameFile = basename(__filename);

type Model = typeof SeqModel & {
  associate?: (models: Models) => void;
};

interface Models {
  [key: string]: Model;
}

const models: Models & { sequelize?: Sequelize } = {};

export const registerModels = (sequelize: Sequelize) => {
  fs.readdirSync(__dirname)
    .filter((file) => {
      return file !== basenameFile && file.endsWith('.ts');
    })
    .forEach((file) => {
      const model = require(join(__dirname, file))(
        sequelize,
        DataTypes
      ) as Model;
      models[model.name] = model;
    });

  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  models.sequelize = sequelize;
};

export default models;
