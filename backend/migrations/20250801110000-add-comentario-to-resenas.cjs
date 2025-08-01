'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar columna comentario
    await queryInterface.addColumn('resenas', 'comentario', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Remover columna comentario
    await queryInterface.removeColumn('resenas', 'comentario');
  }
}; 