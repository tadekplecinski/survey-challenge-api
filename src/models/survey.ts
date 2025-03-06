import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  BelongsToManyAddAssociationsMixin,
} from 'sequelize';
import { User } from './user.ts';
import { Status, UserSurvey } from './userSurvey.ts';
import { Question } from './question.ts';

export default (sequelize: Sequelize) => {
  class Survey extends Model<
    InferAttributes<Survey>,
    InferCreationAttributes<Survey>
  > {
    declare id: CreationOptional<number>;
    declare title: string;

    declare addUser: BelongsToManyAddAssociationsMixin<User, number>;

    static associate(models: any) {
      this.belongsToMany(models.User, {
        through: models.UserSurvey,
        foreignKey: 'surveyId',
      });

      this.hasMany(models.UserSurvey, { foreignKey: 'surveyId' });
    }

    static async createNewSurvey({
      title,
      userId,
      questions,
    }: {
      title: string;
      userId: string;
      questions: string[];
    }) {
      return Survey.sequelize!.transaction(async (t) => {
        const survey = await Survey.create({ title }, { transaction: t });
        const userInstance = await User.findByPk(+userId);

        if (!userInstance) {
          throw new Error('Survey must be associated with a user');
        }

        const userSurvey = await UserSurvey.create(
          {
            userId: userInstance.id,
            surveyId: survey.id,
            status: Status.initial,
          },
          { transaction: t }
        );

        if (questions.length > 0) {
          await Question.bulkCreate(
            questions.map((question) => ({
              question,
              userSurveyId: userSurvey.id,
            })),
            { transaction: t }
          );
        }

        return { survey, userSurvey };
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
      tableName: 'Surveys',
    }
  );
  return Survey;
};
