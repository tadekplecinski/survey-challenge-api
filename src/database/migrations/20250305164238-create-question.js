export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Questions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      question: {
        type: Sequelize.STRING,
      },
      surveyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Surveys', key: 'id' },
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Questions');
  },
};
