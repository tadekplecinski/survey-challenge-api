import { hashSync } from 'bcrypt';

export default {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Roles', [
      { role: 'admin' },
      { role: 'user' },
    ]);

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

    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, role FROM "Roles" WHERE role IN ('admin', 'user')`
    );

    const users = await queryInterface.bulkInsert(
      'Users',
      [
        {
          email: 'admin@example.com',
          password: hashSync('password123', 10),
          userName: 'adminUser',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          email: 'user@example.com',
          password: hashSync('password123', 10),
          userName: 'regularUser',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { returning: true }
    );

    const userIds = users.map((user) => user.id);
    const roleIds = roles.map((user) => user.id);

    await queryInterface.sequelize.query(
      `INSERT INTO "UserRoles" ("userId", "roleId") VALUES 
        (${userIds[0]}, ${roleIds[0]}), 
        (${userIds[1]}, ${roleIds[1]})`
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('UserRoles', {});
    await queryInterface.bulkDelete('Users', {});
    await queryInterface.bulkDelete('Roles', {});
    await queryInterface.bulkDelete('Categories', {});
  },
};
