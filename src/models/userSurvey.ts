import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

export default (sequelize: Sequelize) => {
  class UserSurvey extends Model<
    InferAttributes<UserSurvey>,
    InferCreationAttributes<UserSurvey>
  > {
    static associate(models: any) {
      // define association here
    }
  }
  UserSurvey.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.ENUM('initial', 'draft', 'completed'),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'UserSurvey',
    }
  );
  return UserSurvey;
};
