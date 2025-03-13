import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  BelongsToManyAddAssociationsMixin,
  HasManyGetAssociationsMixin,
} from 'sequelize';
import { UserSurvey } from './userSurvey.ts';
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

  declare addCategories: BelongsToManyAddAssociationsMixin<Category, number>;

  declare getQuestions: HasManyGetAssociationsMixin<Question>;
  declare getUserSurveys: HasManyGetAssociationsMixin<UserSurvey>;
  declare setCategories: (categories: any[]) => Promise<void>;

  static associate(models: any) {
    this.belongsToMany(models.User, {
      through: models.UserSurvey,
      foreignKey: 'surveyId',
    });

    this.hasMany(models.UserSurvey, {
      foreignKey: 'surveyId',
    });

    this.belongsToMany(models.Category, {
      through: 'SurveyCategories',
      foreignKey: 'surveyId',
      otherKey: 'categoryId',
      timestamps: false,
      as: 'categories',
    });

    this.hasMany(models.Question, {
      foreignKey: 'surveyId',
      as: 'questions',
    });
  }

  static async createNewSurvey({
    title,
    questions,
    categories,
  }: {
    title: string;
    questions: string[];
    categories: string[];
  }) {
    const survey = await Survey.create({ title });

    let createdQuestions: Question[] = [];

    if (questions.length > 0) {
      createdQuestions = await Question.bulkCreate(
        questions.map((question) => ({
          question,
          surveyId: survey.id,
        }))
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

    await survey.addCategories(categoryInstances);

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
