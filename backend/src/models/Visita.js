import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Visita = sequelize.define('Visita', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  esCompartida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  maxParticipantes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: 1,
      max: 10
    }
  },
  estado: {
    type: DataTypes.ENUM('activa', 'completada', 'cancelada'),
    allowNull: false,
    defaultValue: 'activa'
  }
}, {
  tableName: 'visitas',
  timestamps: true
});

export default Visita;