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
    await queryInterface.addIndex('CafeEtiquetas', ['cafeId', 'etiquetaId'], {
      unique: true,
      name: 'unique_cafe_etiqueta'
    });

    // Índices para optimizar consultas
    await queryInterface.addIndex('CafeEtiquetas', ['cafeId']);
    await queryInterface.addIndex('CafeEtiquetas', ['etiquetaId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CafeEtiquetas');
  }
};