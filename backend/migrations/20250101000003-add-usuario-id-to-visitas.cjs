'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Primero, agregar la columna sin restricciones
      await queryInterface.addColumn('visitas', 'usuarioId', {
        type: Sequelize.INTEGER,
        allowNull: true // Temporalmente permitimos NULL
      });

      // Actualizar los registros existentes
      await queryInterface.sequelize.query(`
        UPDATE visitas v
        INNER JOIN visitas_compartidas vc ON v.id = vc.visitaId
        SET v.usuarioId = vc.usuarioId
        WHERE vc.rol = 'creador';
      `);

      // Ahora agregar las restricciones
      await queryInterface.changeColumn('visitas', 'usuarioId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('visitas', 'usuarioId');
  }
};