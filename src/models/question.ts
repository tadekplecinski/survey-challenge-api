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
  declare surveyId: number;

  static associate(models: any) {
    this.belongsTo(models.Survey, { foreignKey: 'surveyId' });
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
      surveyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Surveys', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'Question',
      timestamps: false,
    }
  );
  return Question;
};
