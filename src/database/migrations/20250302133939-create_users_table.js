export default {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userName: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Users');
  },
};
