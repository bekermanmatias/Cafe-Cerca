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
      model: 'visitas', // Cambiado a minúsculas
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1 // Por ahora usaremos el usuario 1 por defecto
  },
  nombreUsuario: {
    type: DataTypes.STRING,
    allowNull: false
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fechaHora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Comentario',
  tableName: 'comentarios', // Cambiado a minúsculas
  timestamps: true
});

export default Comentario; 