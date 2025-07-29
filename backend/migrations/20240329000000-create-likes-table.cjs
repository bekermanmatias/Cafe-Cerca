'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Likes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      visitaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'visitas',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Añadir un índice único para evitar likes duplicados
    await queryInterface.addIndex('Likes', ['userId', 'visitaId'], {
      unique: true,
      name: 'likes_user_visita_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Likes');
  }
}; 