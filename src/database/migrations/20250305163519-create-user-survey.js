export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserSurveys', {
      id: {
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
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
        type: Sequelize.ENUM('draft', 'completed'),
        allowNull: false,
        defaultValue: 'draft',
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

    await queryInterface.addConstraint('UserSurveys', {
      fields: ['userId', 'surveyId'],
      type: 'unique',
      name: 'uq_userSurvey_userId_surveyId',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('UserSurveys');
  },
};
