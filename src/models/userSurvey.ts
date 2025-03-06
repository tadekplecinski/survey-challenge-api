import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

enum Status {
  'initial' = 'initial',
  'draft' = 'draft',
  'completed' = 'completed',
}

export default (sequelize: Sequelize) => {
  class UserSurvey extends Model<
    InferAttributes<UserSurvey>,
    InferCreationAttributes<UserSurvey>
  > {
    declare id: CreationOptional<number>;
    declare userId: number;
    declare surveyId: number;
    declare status: Status;

    static associate(models: any) {
      // define association here
    }
  }
  UserSurvey.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
      surveyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Surveys', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(Status)),
        allowNull: false,
        defaultValue: Status.initial,
      },
    },
    {
      sequelize,
      modelName: 'UserSurvey',
      tableName: 'UserSurveys',
    }
  );
  return UserSurvey;
};
