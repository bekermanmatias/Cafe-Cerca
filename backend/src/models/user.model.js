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
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753747419/prede_glxiry.avif' // URL de la imagen predeterminada
    }
  });

  // Asociaciones para el sistema de amigos
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
