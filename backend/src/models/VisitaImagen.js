import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Visita from './Visita.js';

const VisitaImagen = sequelize.define('VisitaImagen', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  visitaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Visita,
      key: 'id'
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  }
}, {
  tableName: 'visita_imagenes',
  timestamps: true
});

// Establecer la relación
Visita.hasMany(VisitaImagen, { 
  foreignKey: 'visitaId',
  as: 'imagenes' 
});
VisitaImagen.belongsTo(Visita, { 
  foreignKey: 'visitaId' 
});

export default VisitaImagen;
