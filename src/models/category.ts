import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  BelongsToManyAddAssociationsMixin,
} from 'sequelize';
import { Survey } from './survey.ts';

export enum CategoryStatus {
  Active = 'active',
  Archived = 'archived',
}

export class Category extends Model<
  InferAttributes<Category>,
  InferCreationAttributes<Category>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: string;
  declare status: CategoryStatus;

  declare addSurvey: BelongsToManyAddAssociationsMixin<Survey, number>;

  static associate(models: any) {
    this.belongsToMany(models.Survey, {
      through: models.SurveyCategory,
      foreignKey: 'categoryId',
    });
  }
}

export default (sequelize: Sequelize) => {
  Category.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM(CategoryStatus.Active, CategoryStatus.Archived),
        allowNull: false,
        defaultValue: CategoryStatus.Active,
      },
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'Categories',
    }
  );
  return Category;
};
