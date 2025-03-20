import { hashSync } from 'bcryptjs';

export default {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'Categories',
      [
        {
          name: 'Tech',
          description: 'All things related to technology.',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Health',
          description: 'Health and fitness',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { returning: true }
    );

    await queryInterface.bulkInsert(
      'Users',
      [
        {
          email: 'admin@example.com',
          password: hashSync('123456', 10),
          userName: 'adminUser',
          role: 'admin',
        },
        {
          email: 'user1@example.com',
          password: hashSync('123456', 10),
          userName: 'regularUser1',
          role: 'user',
        },
        {
          email: 'user2@example.com',
          password: hashSync('123456', 10),
          userName: 'regularUser2',
          role: 'user',
        },
        {
          email: 'user3@example.com',
          password: hashSync('123456', 10),
          userName: 'regularUser3',
          role: 'user',
        },
      ],
      { returning: true }
    );

    await queryInterface.bulkInsert('Surveys', [
      {
        title: 'Tech Trends 2025',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Health Awareness Survey',
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const surveys = await queryInterface.sequelize.query(
      'SELECT id FROM "Surveys";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    await queryInterface.bulkInsert('Questions', [
      {
        question: 'What is your favorite programming language?',
        surveyId: surveys[0].id,
      },
      { question: 'Do you follow AI developments?', surveyId: surveys[0].id },
      { question: 'How often do you exercise?', surveyId: surveys[1].id },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', {});
    await queryInterface.bulkDelete('Categories', {});
    await queryInterface.bulkDelete('Surveys', null, {});
    await queryInterface.bulkDelete('Questions', null, {});
  },
};
