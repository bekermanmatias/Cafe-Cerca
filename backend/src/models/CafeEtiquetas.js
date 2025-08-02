// models/CafeEtiquetas.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CafeEtiquetas = sequelize.define('CafeEtiquetas', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  cafeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  etiquetaId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fechaAsignacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  creadoPor: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'CafeEtiquetas',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['cafeId', 'etiquetaId']
    }
  ]
});

export default CafeEtiquetas;