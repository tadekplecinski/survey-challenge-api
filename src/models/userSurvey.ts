import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  BelongsToGetAssociationMixin,
  HasManyGetAssociationsMixin,
} from 'sequelize';
import { User } from './user.ts';
import { Survey } from './survey.ts';
import { Answer } from './answer.ts';

export enum UserSurveyStatus {
  'draft' = 'draft', // initial status when user is invited, can be saved
  'submitted' = 'submitted', // user no longer can interact with the survey (answer questions)
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

  declare getSurvey: BelongsToGetAssociationMixin<Survey>;
  declare getAnswers: HasManyGetAssociationsMixin<Answer>;

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
        defaultValue: UserSurveyStatus.draft,
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
