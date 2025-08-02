'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Esta migración no es necesaria para una base de datos limpia
    // ya que la tabla visitas_compartidas se creará con todas las columnas necesarias
    console.log('⚠️ Migración omitida: visitas_compartidas se creará completa');
  },

  async down(queryInterface, Sequelize) {
    // Remover índices
    await queryInterface.removeIndex('visitas_compartidas', 'visitas_compartidas_estado_index');
    await queryInterface.removeIndex('visitas_compartidas', 'visitas_compartidas_rol_index');

    // Remover columnas
    await queryInterface.removeColumn('visitas_compartidas', 'fechaRespuesta');
    await queryInterface.removeColumn('visitas_compartidas', 'fechaInvitacion');
    await queryInterface.removeColumn('visitas_compartidas', 'estado');
    await queryInterface.removeColumn('visitas_compartidas', 'rol');
  }
}; 