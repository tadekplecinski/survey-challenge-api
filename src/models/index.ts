import { Sequelize, DataTypes, Model as SeqModel } from 'sequelize';
import path from 'node:path';
import fs from 'node:fs';

const basename = path.basename(__filename);

type Model = typeof SeqModel & {
  associate?: (models: Models) => void;
  sequelize?: Sequelize;
};

interface Models {
  [key: string]: Model;
}

const models: Models & { sequelize?: Sequelize } = {};

export const registerModels = (sequelize: Sequelize) => {
  fs.readdirSync(__dirname)
    .filter((file) => {
      return file !== basename && file.endsWith('.ts');
    })
    .forEach((file) => {
      const model = require(path.join(__dirname, file))(
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
