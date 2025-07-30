import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Comentario extends Model {}

Comentario.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  visitaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'visitas',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Cambiado de 'users' a 'Users'
      key: 'id'
    }
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false
  },

}, {
  sequelize,
  modelName: 'Comentario',
  tableName: 'comentarios',
  timestamps: true
});

export default Comentario; 