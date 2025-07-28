// models/Cafe.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // tu instancia Sequelize

const Cafe = sequelize.define('Cafe', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true
  },
  openingHours: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lat: {
  type: DataTypes.FLOAT,
  allowNull: false,
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

}, {
  tableName: 'cafes',     // 👈 esto fuerza a Sequelize a usar la tabla correcta
  timestamps: true        // 👈 asegura que maneje createdAt y updatedAt
});

export default Cafe;
