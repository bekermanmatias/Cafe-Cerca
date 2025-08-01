'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Verificar si la columna ya existe
      const [results] = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM `visitas` LIKE 'usuarioId'"
      );
      
      if (results.length === 0) {
        // Primero, agregar la columna sin restricciones
        await queryInterface.addColumn('visitas', 'usuarioId', {
          type: Sequelize.INTEGER,
          allowNull: true // Temporalmente permitimos NULL
        });
      } else {
        console.log('⚠️ Columna usuarioId ya existe en visitas');
      }

      // Actualizar los registros existentes (comentado para base de datos limpia)
      // await queryInterface.sequelize.query(`
      //   UPDATE visitas v
      //   INNER JOIN visitas_compartidas vc ON v.id = vc.visitaId
      //   SET v.usuarioId = vc.usuarioId
      //   WHERE vc.rol = 'creador';
      // `);

      // Ahora agregar las restricciones (comentado para base de datos limpia)
      // await queryInterface.changeColumn('visitas', 'usuarioId', {
      //   type: Sequelize.INTEGER,
      //   allowNull: false,
      //   references: {
      //     model: 'Users',
      //     key: 'id'
      //   },
      //   onUpdate: 'CASCADE',
      //   onDelete: 'CASCADE'
      // });
    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('visitas', 'usuarioId');
  }
};