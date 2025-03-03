import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  class Role extends Model {
    static associate(models: any) {
      this.belongsTo(models.User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    }
  }

  Role.init(
    { role: { type: DataTypes.STRING } },
    { sequelize, modelName: 'Role' }
  );

  return Role;
};
