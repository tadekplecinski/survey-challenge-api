import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

export class SurveyCategory extends Model<
  InferAttributes<SurveyCategory>,
  InferCreationAttributes<SurveyCategory>
> {
  declare surveyId: number;
  declare categoryId: number;

  static associate(models: any) {
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
      onDelete: 'CASCADE',
    });
    this.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      onDelete: 'CASCADE',
    });
  }
}

export default (sequelize: Sequelize) => {
  SurveyCategory.init(
    {
      surveyId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Surveys', key: 'id' },
        primaryKey: true,
      },
      categoryId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Categories', key: 'id' },
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: 'SurveyCategory',
      tableName: 'SurveyCategories',
      timestamps: false, // ✅ Since it's a join table, no need for createdAt/updatedAt
    }
  );

  return SurveyCategory;
};
