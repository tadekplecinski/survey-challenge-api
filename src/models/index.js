import { fileURLToPath } from 'node:url';
import path, { dirname } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const models = {};

export const registerModels = async (sequelize) => {
  const thisFile = path.basename(__filename);
  const modelFiles = fs.readdirSync(__dirname);
  const filteredModelFiles = modelFiles.filter((file) => {
    return file !== thisFile && file.endsWith('.ts');
  });

  for (const file of filteredModelFiles) {
    let modelPath = path.join(__dirname, file);

    if (process.platform === 'win32') {
      modelPath = `file:///${modelPath.replace(/\\/g, '/')}`;
    }

    try {
      const modelModule = await import(modelPath);
      const model = modelModule.default(sequelize);
      models[model.name] = model;
    } catch (err) {
      console.error(`Error loading model from file: ${file}`, err);
    }
  }

  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });
};

export default models;
