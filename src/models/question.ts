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
    },
    {
      sequelize,
      modelName: 'Question',
    }
  );
  return Question;
};
