import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export class Answer extends Model<
  InferAttributes<Answer>,
  InferCreationAttributes<Answer>
> {
  declare id: CreationOptional<number>;
  declare answer: string;
  declare questionId: number;
  declare userSurveyId: number;

  static associate(models: any) {
    this.belongsTo(models.UserSurvey, { foreignKey: 'userSurveyId' });
  }
}

export default (sequelize: Sequelize) => {
  Answer.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      answer: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Questions', key: 'id' },
      },
      userSurveyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'UserSurveys', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'Answer',
      timestamps: false,
    }
  );

  return Answer;
};
