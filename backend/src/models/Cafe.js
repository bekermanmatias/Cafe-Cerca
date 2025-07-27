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
    type: DataTypes.JSON, // array de strings como ["wifi", "dog-friendly"]
    allowNull: true
  },
  openingHours: {
    type: DataTypes.STRING, // "08:00-20:00" o algo así
    allowNull: true
  }
});

export default Cafe;
