import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Like extends Model {
  static associate(models) {
    Like.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Like.belongsTo(models.Visita, {
      foreignKey: 'visitaId',
      as: 'visita'
    });
  }
}

Like.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  visitaId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Like',
});

export default Like; 