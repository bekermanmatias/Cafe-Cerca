'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('comentarios', 'nombreUsuario');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('comentarios', 'nombreUsuario', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Usuario'
    });
  }
}; 