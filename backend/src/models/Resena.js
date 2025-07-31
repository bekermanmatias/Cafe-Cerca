import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Resena = sequelize.define('Resena', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  visitaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'visitas',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  calificacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'resenas',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['visitaId', 'usuarioId']
    }
  ]
});

export default Resena; 