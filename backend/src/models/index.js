// models/index.js
import Visita from './Visita.js';
import Cafe from './Cafe.js';
import VisitaImagen from './VisitaImagen.js';
import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import userModel from './user.model.js';
import Comentario from './Comentario.js';
import Like from './Like.js';
import SavedCafe from './SavedCafe.js';
import amigosModel from './amigos.js';

// Inicializar modelos
const User = userModel(sequelize, DataTypes);
const Amigos = amigosModel(sequelize, DataTypes);

// Ejecutar asociaciones definidas en User
if (User.associate) {
  User.associate({ User });
}

// Ejecutar asociaciones definidas en Amigos
if (Amigos.associate) {
  Amigos.associate({ User });
}

// Relaciones externas

// Visita - Cafe
Visita.belongsTo(Cafe, {
  foreignKey: 'cafeteriaId',
  as: 'cafeteria'
});
Cafe.hasMany(Visita, {
  foreignKey: 'cafeteriaId',
  as: 'visitas'
});

// Visita - VisitaImagen
Visita.hasMany(VisitaImagen, {
  foreignKey: 'visitaId',
  as: 'visitaImagenes'
});
VisitaImagen.belongsTo(Visita, {
  foreignKey: 'visitaId',
  as: 'visita'
});

// User - Visita
User.hasMany(Visita, {
  foreignKey: 'usuarioId',
  as: 'visitas'
});
Visita.belongsTo(User, {
  foreignKey: 'usuarioId',
  as: 'usuario'
});

// Visita - Comentario
Visita.hasMany(Comentario, {
  foreignKey: 'visitaId',
  as: 'comentarios',
  onDelete: 'CASCADE'
});
Comentario.belongsTo(Visita, {
  foreignKey: 'visitaId',
  as: 'visita'
});

// Relación entre Usuario y Comentario
User.hasMany(Comentario, {
  foreignKey: 'userId',
  as: 'comentarios'
});

Comentario.belongsTo(User, {
  foreignKey: 'userId',
  as: 'usuario'
});

// Relaciones para Likes
User.hasMany(Like, {
  foreignKey: 'userId',
  as: 'likes'
});

Like.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Visita.hasMany(Like, {
  foreignKey: 'visitaId',
  as: 'likes'
});

Like.belongsTo(Visita, {
  foreignKey: 'visitaId',
  as: 'visita'
});

// Relaciones para SavedCafes
User.hasMany(SavedCafe, {
  foreignKey: 'userId',
  as: 'savedCafes'
});

SavedCafe.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Cafe.hasMany(SavedCafe, {
  foreignKey: 'cafeId',
  as: 'savedBy'
});

SavedCafe.belongsTo(Cafe, {
  foreignKey: 'cafeId',
  as: 'cafe'
});

// Sincronizar tablas en la base de datos
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Tablas sincronizadas correctamente'))
  .catch((err) => console.error('❌ Error sincronizando tablas:', err));

// Exportar todos los modelos
export { 
  Visita, 
  Cafe, 
  VisitaImagen, 
  User, 
  Comentario,
  Like,
  SavedCafe,
  Amigos
};
