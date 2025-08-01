// models/Etiqueta.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Etiqueta = sequelize.define('Etiqueta', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  icono: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      isValidIcon(value) {
        // Lista de iconos válidos de Lucide React (puedes expandir)
        const validIcons = [
          'wifi', 'heart', 'sun', 'coffee', 'car', 'music', 'volume-x', 
          'laptop', 'utensils', 'users', 'clock', 'map-pin', 'star',
          'home', 'phone', 'mail', 'camera', 'bookmark', 'shield',
          'leaf', 'zap', 'gift', 'headphones', 'gamepad-2'
        ];
        
        if (!validIcons.includes(value)) {
          throw new Error(`El ícono '${value}' no es válido. Iconos disponibles: ${validIcons.join(', ')}`);
        }
      }
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'etiquetas',
  timestamps: true,
  hooks: {
    beforeSave: (etiqueta) => {
      // Capitalizar primera letra
      etiqueta.nombre = etiqueta.nombre.charAt(0).toUpperCase() + etiqueta.nombre.slice(1).toLowerCase();
    }
  }
});

export default Etiqueta;