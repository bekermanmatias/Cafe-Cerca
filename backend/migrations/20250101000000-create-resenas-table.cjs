'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resenas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      visitaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'visitas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      calificacion: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      mensaje: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      imagenUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fecha: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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

    // Crear índice único para evitar reseñas duplicadas
    await queryInterface.addIndex('resenas', ['visitaId', 'usuarioId'], {
      unique: true,
      name: 'resenas_visita_usuario_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('resenas');
  }
}; 