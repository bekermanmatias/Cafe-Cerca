'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar columna estado
    await queryInterface.addColumn('visitas', 'estado', {
      type: Sequelize.ENUM('activa', 'completada', 'cancelada'),
      allowNull: false,
      defaultValue: 'activa'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir cambio
    await queryInterface.removeColumn('visitas', 'estado');
  }
}; 