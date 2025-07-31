import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Example = sequelize.define('Example', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'example_table',
  timestamps: true, // Activa createdAt y updatedAt
  // Opcional: personalizar nombres de columnas
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default Example;