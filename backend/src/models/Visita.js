import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Visita = sequelize.define('Visita', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
  cafeteriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cafes',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  calificacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  imagenUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'visitas',
  timestamps: true
});

export default Visita;