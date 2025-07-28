'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('Users', 'profileImage', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      });
    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('Users', 'profileImage');
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
}; 