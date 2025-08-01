'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Eliminar la columna tags de la tabla cafes
    await queryInterface.removeColumn('cafes', 'tags');
  },

  async down(queryInterface, Sequelize) {
    // En caso de rollback, restaurar la columna tags
    await queryInterface.addColumn('cafes', 'tags', {
      type: Sequelize.JSON,
      allowNull: true
    });
  }
};