'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar campos a la tabla visitas
    await queryInterface.addColumn('visitas', 'esCompartida', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('visitas', 'maxParticipantes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 10
    });

    // Crear tabla visitas_compartidas
    await queryInterface.createTable('visitas_compartidas', {
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
      rol: {
        type: Sequelize.ENUM('creador', 'participante'),
        allowNull: false,
        defaultValue: 'participante'
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'aceptada', 'rechazada'),
        allowNull: false,
        defaultValue: 'pendiente'
      },
      fechaInvitacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      fechaRespuesta: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Agregar índices únicos
    await queryInterface.addIndex('visitas_compartidas', ['visitaId', 'usuarioId'], {
      unique: true,
      name: 'visitas_compartidas_visitaId_usuarioId_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar tabla visitas_compartidas
    await queryInterface.dropTable('visitas_compartidas');

    // Eliminar campos de la tabla visitas
    await queryInterface.removeColumn('visitas', 'esCompartida');
    await queryInterface.removeColumn('visitas', 'maxParticipantes');
  }
}; 