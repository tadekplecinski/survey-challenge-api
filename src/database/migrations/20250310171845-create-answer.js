export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Answers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      answer: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      questionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Questions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userSurveyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'UserSurveys',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    queryInterface.addConstraint('Answers', {
      fields: ['questionId', 'userSurveyId'],
      type: 'unique',
      name: 'uq_answer_question_userSurvey',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Answers');
  },
};
