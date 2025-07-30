export default (sequelize, DataTypes) => {
  const Amigos = sequelize.define('Amigos', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    friendId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    }
  });

  Amigos.associate = (models) => {
    Amigos.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'solicitante'
    });

    Amigos.belongsTo(models.User, {
      foreignKey: 'friendId',
      as: 'destinatario'
    });
  };

  return Amigos;
};
