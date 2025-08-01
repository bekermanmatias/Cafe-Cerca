'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Crear tabla intermedia para la relación muchos-a-muchos
    await queryInterface.createTable('CafeEtiquetas', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      cafeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cafes',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      etiquetaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'etiquetas',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      fechaAsignacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Cuándo se asignó esta etiqueta al café'
      },
      creadoPor: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users', // Asumiendo que tienes una tabla users
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'Usuario que asignó la etiqueta (opcional)'
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

    // Índice único para evitar duplicados
    try {
      await queryInterface.addIndex('CafeEtiquetas', ['cafeId', 'etiquetaId'], {
        unique: true,
        name: 'unique_cafe_etiqueta'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('⚠️ Índice unique_cafe_etiqueta ya existe');
    }

    // Índices para optimizar consultas
    try {
      await queryInterface.addIndex('CafeEtiquetas', ['cafeId']);
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('⚠️ Índice en cafeId ya existe');
    }
    
    try {
      await queryInterface.addIndex('CafeEtiquetas', ['etiquetaId']);
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('⚠️ Índice en etiquetaId ya existe');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CafeEtiquetas');
  }
};