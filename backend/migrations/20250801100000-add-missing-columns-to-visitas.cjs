'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar columna esCompartida
    await queryInterface.addColumn('visitas', 'esCompartida', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Agregar columna maxParticipantes
    await queryInterface.addColumn('visitas', 'maxParticipantes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 10
    });

    // Agregar índices para las nuevas columnas
    await queryInterface.addIndex('visitas', ['esCompartida'], {
      name: 'visitas_es_compartida_index'
    });

    await queryInterface.addIndex('visitas', ['maxParticipantes'], {
      name: 'visitas_max_participantes_index'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remover índices
    await queryInterface.removeIndex('visitas', 'visitas_es_compartida_index');
    await queryInterface.removeIndex('visitas', 'visitas_max_participantes_index');

    // Remover columnas
    await queryInterface.removeColumn('visitas', 'maxParticipantes');
    await queryInterface.removeColumn('visitas', 'esCompartida');
  }
}; 