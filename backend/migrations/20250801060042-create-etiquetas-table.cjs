'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('etiquetas', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      icono: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Nombre del ícono de Lucide React (ej: coffee, wifi, car)'
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Para poder desactivar etiquetas sin eliminarlas'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Insertar etiquetas iniciales comunes para cafeterías
    await queryInterface.bulkInsert('etiquetas', [
      { nombre: 'WiFi Gratis', icono: 'wifi', activo: true, createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Pet Friendly', icono: 'heart', activo: true, createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Terraza', icono: 'sun', activo: true, createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Desayunos', icono: 'coffee', activo: true, createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Estacionamiento', icono: 'car', activo: true, createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Música en vivo', icono: 'music', activo: true, createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Ambiente tranquilo', icono: 'volume-x', activo: true, createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Para trabajar', icono: 'laptop', activo: true, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('etiquetas');
  }
};