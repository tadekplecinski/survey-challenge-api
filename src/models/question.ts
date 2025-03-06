import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

export default (sequelize: Sequelize) => {
  class Question extends Model<
    InferAttributes<Question>,
    InferCreationAttributes<Question>
  > {
    declare id: number;
    declare question: string;
    declare answer: string;
    declare surveyId: string;

    static associate(models: any) {
      this.belongsTo(models.Survey);
    }
  }
  Question.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      question: { type: DataTypes.STRING, allowNull: false },
      answer: { type: DataTypes.STRING }, // initially null
      surveyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Surveys', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'Question',
    }
  );
  return Question;
};
