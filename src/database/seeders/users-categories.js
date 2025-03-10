import { hashSync } from 'bcrypt';
import { UserRole } from '../../models/user.ts';

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
          createdAt: new Date(),
          updatedAt: new Date(),
          role: UserRole.ADMIN,
        },
        {
          email: 'user@example.com',
          password: hashSync('password123', 10),
          userName: 'regularUser',
          createdAt: new Date(),
          updatedAt: new Date(),
          role: UserRole.USER,
        },
      ],
      { returning: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('UserRoles', {});
    await queryInterface.bulkDelete('Users', {});
    await queryInterface.bulkDelete('Roles', {});
    await queryInterface.bulkDelete('Categories', {});
  },
};
