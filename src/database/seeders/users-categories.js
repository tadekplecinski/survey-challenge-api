import { hashSync } from 'bcrypt';

export default {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'Categories',
      [
        {
          name: 'Technology',
          description: 'All things related to technology.',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Business',
          description: 'Business, finance, and entrepreneurship.',
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
          password: hashSync('password123', 10),
          userName: 'adminUser',
          role: 'admin',
        },
        {
          email: 'user@example.com',
          password: hashSync('password123', 10),
          userName: 'regularUser',
          role: 'user',
        },
      ],
      { returning: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', {});
    await queryInterface.bulkDelete('Categories', {});
  },
};
