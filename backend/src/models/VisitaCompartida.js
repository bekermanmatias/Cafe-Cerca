import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const VisitaCompartida = sequelize.define('VisitaCompartida', {
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
  rol: {
    type: DataTypes.ENUM('creador', 'participante'),
    allowNull: false,
    defaultValue: 'participante'
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aceptada', 'rechazada'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  fechaInvitacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fechaRespuesta: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'visitas_compartidas',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['visitaId', 'usuarioId']
    }
  ]
});

export default VisitaCompartida; 