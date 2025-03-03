import { Sequelize, Model as SeqModel } from 'sequelize';
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

export type ModelsType = Models & { sequelize?: Sequelize };

const models: ModelsType = {};

export const registerModels = async (sequelize: Sequelize) => {
  const files = fs.readdirSync(__dirname).filter((file) => {
    return file !== basenameFile && file.endsWith('.ts');
  });

  for (const file of files) {
    const modelModule = await import(join(__dirname, file));
    const model = modelModule.default(sequelize) as Model;

    models[model.name] = model;
  }

  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  models.sequelize = sequelize;
};

export default models;
