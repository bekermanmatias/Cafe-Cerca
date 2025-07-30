// models/user.js
export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  // Asociaciones
  User.associate = (models) => {
    User.belongsToMany(models.User, {
      through: 'UserFriends',
      as: 'friends',
      foreignKey: 'userId',
      otherKey: 'friendId'
    });

    User.belongsToMany(models.User, {
      through: 'UserFriends',
      as: 'friendOf',
      foreignKey: 'friendId',
      otherKey: 'userId'
    });
  };

  return User;
};
