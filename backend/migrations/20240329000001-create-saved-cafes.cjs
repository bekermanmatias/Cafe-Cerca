'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SavedCafes', {
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
      cafeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cafes',
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

    // Añadir un índice único para evitar duplicados
    try {
      await queryInterface.addIndex('SavedCafes', ['userId', 'cafeId'], {
        unique: true,
        name: 'saved_cafes_user_cafe_unique'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('⚠️ Índice saved_cafes_user_cafe_unique ya existe');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SavedCafes');
  }
}; 