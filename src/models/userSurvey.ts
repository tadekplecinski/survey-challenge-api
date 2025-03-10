import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

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

  static associate(models: any) {
    this.belongsTo(models.User, { foreignKey: 'userId' });
    this.belongsTo(models.Survey, { foreignKey: 'surveyId' });
    this.hasMany(models.Answer, { foreignKey: 'userSurveyId' });
  }

  // static async updateUserSurveyAnswers({
  //   userSurveyId,
  //   answers,
  // }: {
  //   userSurveyId: number;
  //   answers: { questionId: number; answer: string }[];
  // }) {
  //   return Survey.sequelize!.transaction(async (t) => {
  //     const userSurvey = await UserSurvey.findByPk(userSurveyId, {
  //       transaction: t,
  //     });

  //     if (!userSurvey) {
  //       throw new Error('UserSurvey not found');
  //     }

  //     // ✅ Now get associated questions using Sequelize association
  //     const questions = await Question.findAll({
  //       where: { userSurveyId },
  //       transaction: t,
  //     });

  //     if (questions.length !== answers.length) {
  //       throw new Error('All questions must have an answer');
  //     }

  //     // Ensure all answers are provided and non-empty
  //     const answerMap = new Map(
  //       answers.map(({ questionId, answer }) => [questionId, answer.trim()])
  //     );

  //     for (const question of questions) {
  //       if (!answerMap.has(question.id) || answerMap.get(question.id) === '') {
  //         throw new Error(
  //           `Answer for question ID ${question.id} is missing or empty`
  //         );
  //       }
  //     }

  //     // Update answers
  //     await Promise.all(
  //       questions.map((question) =>
  //         question.update(
  //           { answer: answerMap.get(question.id) },
  //           { transaction: t }
  //         )
  //       )
  //     );

  //     return {
  //       userSurveyId,
  //       status: 'completed',
  //       updatedAnswers: answers,
  //     };
  //   });
  // }
}

export default (sequelize: Sequelize) => {
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
        type: DataTypes.ENUM(...Object.values(UserSurveyStatus)),
        allowNull: false,
        defaultValue: UserSurveyStatus.initial,
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
