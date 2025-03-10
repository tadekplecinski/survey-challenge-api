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
import { UserSurveyStatus, UserSurvey } from './userSurvey.ts';
import { Question } from './question.ts';
import { Category } from './category.ts';

export enum SurveyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export class Survey extends Model<
  InferAttributes<Survey>,
  InferCreationAttributes<Survey>
> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare status: CreationOptional<SurveyStatus>;

  declare addUser: BelongsToManyAddAssociationsMixin<User, number>;
  declare addCategories: BelongsToManyAddAssociationsMixin<Category, number>;

  static associate(models: any) {
    this.belongsToMany(models.User, {
      through: models.UserSurvey,
      foreignKey: 'surveyId',
    });

    this.hasMany(models.UserSurvey, { foreignKey: 'surveyId' });

    this.belongsToMany(models.Category, {
      through: 'SurveyCategories',
      foreignKey: 'surveyId',
      otherKey: 'categoryId',
      timestamps: false,
    });

    this.hasMany(models.Question, {
      foreignKey: 'surveyId',
    });
  }

  static async createNewSurvey({
    title,
    userId,
    questions,
    categories,
  }: {
    title: string;
    userId: string;
    questions: string[];
    categories: string[];
  }) {
    return Survey.sequelize!.transaction(async (t) => {
      const survey = await Survey.create({ title }, { transaction: t });
      const userInstance = await User.findByPk(+userId);

      if (!userInstance) {
        throw new Error('Survey must be associated with a user');
      }

      // survey can be created independently of user survey!!!!
      // questions are now related one-to-many to survey!!!! not user-survey

      // const userSurvey = await UserSurvey.create(
      //   {
      //     userId: userInstance.id,
      //     surveyId: survey.id,
      //     status: Status.initial,
      //   },
      //   { transaction: t }
      // );

      let createdQuestions: Question[] = [];

      if (questions.length > 0) {
        createdQuestions = await Question.bulkCreate(
          questions.map((question) => ({
            question,
            surveyId: survey.id,
          })),
          { transaction: t }
        );
      }

      const categoryInstances = await Category.findAll({
        where: {
          name: categories,
        },
      });

      if (categoryInstances.length !== categories.length) {
        throw new Error('Some categories do not exist');
      }

      await survey.addCategories(categoryInstances, { transaction: t });

      return {
        title: survey.title,
        status: survey.status,
        questions: createdQuestions.map(({ id, question }) => ({
          id,
          question,
        })),
        categories: categoryInstances.map(({ id, name }) => ({
          id,
          name,
        })),
      };
    });
  }
}

export default (sequelize: Sequelize) => {
  Survey.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM(SurveyStatus.DRAFT, SurveyStatus.PUBLISHED),
        allowNull: false,
        defaultValue: SurveyStatus.DRAFT,
      },
    },
    {
      sequelize,
      modelName: 'Survey',
      tableName: 'Surveys',
    }
  );
  return Survey;
};
