'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
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
        defaultValue: 'aceptada'
      },
      fechaInvitacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      fechaRespuesta: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Agregar índice único para evitar duplicados
    try {
      await queryInterface.addIndex('visitas_compartidas', ['visitaId', 'usuarioId'], {
        unique: true,
        name: 'visitas_compartidas_visita_usuario_unique'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('⚠️ Índice visitas_compartidas_visita_usuario_unique ya existe');
    }

    // Agregar índices para búsquedas comunes
    try {
      await queryInterface.addIndex('visitas_compartidas', ['usuarioId'], {
        name: 'visitas_compartidas_usuario_index'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('⚠️ Índice visitas_compartidas_usuario_index ya existe');
    }

    try {
      await queryInterface.addIndex('visitas_compartidas', ['estado'], {
        name: 'visitas_compartidas_estado_index'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('⚠️ Índice visitas_compartidas_estado_index ya existe');
    }

    try {
      await queryInterface.addIndex('visitas_compartidas', ['rol'], {
        name: 'visitas_compartidas_rol_index'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('⚠️ Índice visitas_compartidas_rol_index ya existe');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('visitas_compartidas');
  }
}; 