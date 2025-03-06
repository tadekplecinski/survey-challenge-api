export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserSurveys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
      surveyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Surveys', key: 'id' },
      },
      status: {
        type: Sequelize.ENUM('initial', 'draft', 'completed'),
        allowNull: false,
        defaultValue: 'initial',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('UserSurveys');
  },
};
