import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export class Question extends Model<
  InferAttributes<Question>,
  InferCreationAttributes<Question>
> {
  declare id: CreationOptional<number>;
  declare question: string;
  declare answer?: string;
  declare userSurveyId: number;

  static associate(models: any) {
    this.belongsTo(models.UserSurvey, { foreignKey: 'userSurveyId' });
  }
}

export default (sequelize: Sequelize) => {
  Question.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      question: { type: DataTypes.STRING },
      answer: { type: DataTypes.STRING }, // initially null
      userSurveyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'UserSurveys', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'Question',
    }
  );
  return Question;
};
