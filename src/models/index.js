import { fileURLToPath } from 'node:url';
import path, { dirname } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const models = {};

export const registerModels = async (sequelize) => {
  const thisFile = path.basename(__filename); // index.js
  const modelFiles = fs.readdirSync(__dirname);
  const filteredModelFiles = modelFiles.filter((file) => {
    return file !== thisFile && file.endsWith('.ts');
  });

  for (const file of filteredModelFiles) {
    try {
      // Using dynamic import to load the model module
      const modelModule = await import(path.join(__dirname, file));

      if (modelModule.default) {
        const model = modelModule.default(sequelize); // Assuming each model has a default export function
        models[model.name] = model;
      } else {
        console.error(`No default export found in model file: ${file}`);
      }
    } catch (err) {
      console.error(`Error importing model file ${file}:`, err);
    }
  }

  // Associate models
  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });
};

export default models;
