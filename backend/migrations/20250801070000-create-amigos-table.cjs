'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Crear tabla amigos
    await queryInterface.createTable('Amigos', {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      friendId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Agregar índices únicos para evitar duplicados
    try {
      await queryInterface.addIndex('Amigos', ['userId', 'friendId'], {
        unique: true,
        name: 'amigos_user_friend_unique'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('⚠️ Índice amigos_user_friend_unique ya existe');
    }

    // Agregar índice para búsquedas por status
    try {
      await queryInterface.addIndex('Amigos', ['status'], {
        name: 'amigos_status_index'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('⚠️ Índice amigos_status_index ya existe');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Amigos');
  }
}; 