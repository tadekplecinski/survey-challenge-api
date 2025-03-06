import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  BelongsToManyAddAssociationsMixin,
} from 'sequelize';
import user, { User } from './user.ts';

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
        foreignKey: 'surveyId', // This should match Survey's reference in UserSurvey
        otherKey: 'userId', // This should match User's reference in UserSurvey
      });
    }

    static async createNewSurvey({
      title,
      userId,
    }: {
      title: string;
      userId: string;
    }) {
      return Survey.sequelize!.transaction(async (t) => {
        const survey = await Survey.create({ title }, { transaction: t });
        const userInstance = await User.findByPk(+userId);

        if (!userInstance) {
          throw new Error('Survey must be associated with a user');
        }

        await survey.addUser([userInstance], { transaction: t });

        return survey;
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
    }
  );
  return Survey;
};
