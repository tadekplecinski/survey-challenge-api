import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

export default (sequelize: Sequelize) => {
  class Survey extends Model<
    InferAttributes<Survey>,
    InferCreationAttributes<Survey>
  > {
    declare id: number;
    declare title: string;

    static associate(models: any) {
      this.belongsToMany(models.User, {
        through: models.UserSurvey,
        // foreignKey: 'userId',
        // otherKey: 'surveyId',
      });
    }
  }
  Survey.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: 'Survey',
    }
  );
  return Survey;
};
