'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('cafes', 'lat', {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
    await queryInterface.addColumn('cafes', 'lng', {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('cafes', 'lat');
    await queryInterface.removeColumn('cafes', 'lng');
  },
};
