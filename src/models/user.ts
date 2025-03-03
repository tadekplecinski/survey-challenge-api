import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  BelongsToManyAddAssociationsMixin,
} from 'sequelize';
import bcrypt from 'bcrypt';
import environment from '../config/environment.ts';
import { Role } from './role.ts';

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare password: string;
  declare userName: string;
  declare firstName: CreationOptional<string>;
  declare lastName: CreationOptional<string>;

  declare setRoles: BelongsToManyAddAssociationsMixin<Role, number>;

  static associate(models: any) {
    this.belongsToMany(models.Role, {
      through: models.UserRole,
      foreignKey: 'userId',
      otherKey: 'roleId',
    });
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, environment.saltRounds);
  }

  static async createNewUser({
    email,
    password,
    roles,
    userName,
    firstName,
    lastName,
  }: {
    email: string;
    password: string;
    roles: string[];
    userName: string;
    firstName: string;
    lastName: string;
  }) {
    return User.sequelize!.transaction(async (t) => {
      const user = await User.create(
        { email, password, userName, firstName, lastName },
        { transaction: t }
      );

      const existingRoles = await Promise.all(
        roles.map(async (roleName) => {
          let role = await User.sequelize!.models.Role.findOne({
            where: { role: roleName },
            transaction: t,
          });

          if (!role) {
            role = await User.sequelize!.models.Role.create(
              { role: roleName },
              { transaction: t }
            );
          }

          return role as Role;
        })
      );

      await user.setRoles(existingRoles, { transaction: t });

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

export type UserModel = typeof User;

export default (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
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
      firstName: {
        type: DataTypes.STRING(50),
        validate: {
          len: {
            args: [3, 50],
            msg: 'First name must contain between 3 and 50 characters',
          },
        },
      },
      lastName: {
        type: DataTypes.STRING(50),
        validate: {
          len: {
            args: [3, 50],
            msg: 'Last name must contain between 3 and 50 characters',
          },
        },
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
    }
  );

  User.beforeSave(async (user) => {
    if (user.password) {
      user.password = await User.hashPassword(user.password);
    }
  });

  return User;
};
