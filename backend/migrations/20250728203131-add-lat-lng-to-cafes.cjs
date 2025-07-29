'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verificar si las columnas ya existen
      const tableInfo = await queryInterface.describeTable('cafes');
      
      if (!tableInfo.lat) {
        await queryInterface.addColumn('cafes', 'lat', {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 0
        });
      }
      
      if (!tableInfo.lng) {
        await queryInterface.addColumn('cafes', 'lng', {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 0
        });
      }
    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    try {
      const tableInfo = await queryInterface.describeTable('cafes');
      
      if (tableInfo.lat) {
        await queryInterface.removeColumn('cafes', 'lat');
      }
      if (tableInfo.lng) {
        await queryInterface.removeColumn('cafes', 'lng');
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  },
};
