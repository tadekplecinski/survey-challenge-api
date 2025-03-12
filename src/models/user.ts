import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare password: string;
  declare userName: string;
  declare role: UserRole;

  static associate(models: any) {
    this.belongsToMany(models.Survey, {
      through: models.UserSurvey,
      foreignKey: 'userId',
    });

    this.hasMany(models.UserSurvey, { foreignKey: 'userId' });
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async createNewUser({
    email,
    password,
    userName,
    role,
  }: {
    email: string;
    password: string;
    role: UserRole;
    userName: string;
  }) {
    return User.sequelize!.transaction(async (t) => {
      const user = await User.create(
        { email, password, userName, role },
        { transaction: t }
      );

      return user;
    });
  }

  comparePasswords(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  toJSON() {
    return { ...this.get(), password: undefined };
  }
}

export default (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: 'Not a valid email address' },
          notNull: { msg: 'Email is required' },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userName: {
        type: DataTypes.STRING(50),
        unique: true,
        validate: {
          len: {
            args: [2, 50],
            msg: 'Username must contain between 2 and 50 characters',
          },
        },
      },
      role: {
        type: DataTypes.ENUM(UserRole.USER, UserRole.ADMIN),
        defaultValue: UserRole.USER,
      },
    },
    {
      sequelize,
      modelName: 'User',
      defaultScope: { attributes: { exclude: ['password'] } },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
      },
      timestamps: false,
    }
  );

  User.beforeSave(async (user) => {
    if (user.password) {
      user.password = await User.hashPassword(user.password);
    }
  });

  return User;
};
