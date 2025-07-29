import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class SavedCafe extends Model {
  static associate(models) {
    SavedCafe.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    SavedCafe.belongsTo(models.Cafe, {
      foreignKey: 'cafeId',
      as: 'cafe'
    });
  }
}

SavedCafe.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cafeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'SavedCafe',
  tableName: 'SavedCafes' // Especificar explícitamente el nombre de la tabla
});

export default SavedCafe; 