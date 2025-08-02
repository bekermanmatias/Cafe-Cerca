// models/Cafe.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cafe = sequelize.define('Cafe', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 200]
    }
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  openingHours: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    }
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    }
  }
}, {
  tableName: 'cafes',
  timestamps: true,
  hooks: {
    beforeSave: (cafe) => {
      // Capitalizar nombre si es necesario
      if (cafe.name) {
        cafe.name = cafe.name.trim();
      }
      if (cafe.address) {
        cafe.address = cafe.address.trim();
      }
    }
  }
});

export default Cafe;