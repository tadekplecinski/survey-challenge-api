import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { User } from './user.ts';

export enum UserSurveyStatus {
  'initial' = 'initial', // user was invited to take the survey
  'draft' = 'draft', // for saving a survey before submitting
  'completed' = 'completed',
}

export class UserSurvey extends Model<
  InferAttributes<UserSurvey>,
  InferCreationAttributes<UserSurvey>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare surveyId: number;
  declare status: CreationOptional<UserSurveyStatus>;
  declare User?: User;

  static associate(models: any) {
    this.belongsTo(models.User, { foreignKey: 'userId' });
    this.belongsTo(models.Survey, { foreignKey: 'surveyId' });
    this.hasMany(models.Answer, { foreignKey: 'userSurveyId' });
  }
}

export default (sequelize: Sequelize) => {
  UserSurvey.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.INTEGER,
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
        type: DataTypes.ENUM(...Object.values(UserSurveyStatus)),
        allowNull: false,
        defaultValue: UserSurveyStatus.initial,
      },
    },
    {
      sequelize,
      modelName: 'UserSurvey',
      tableName: 'UserSurveys',
      indexes: [
        {
          unique: true, // ensure uniqueness of (userId, surveyId)
          fields: ['userId', 'surveyId'],
        },
      ],
    }
  );
  return UserSurvey;
};
