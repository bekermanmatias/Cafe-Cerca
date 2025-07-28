import Visita from './Visita.js';
import Cafe from './Cafe.js';
import VisitaImagen from './VisitaImagen.js';
import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import userModel from './user.model.js';
import Comentario from './Comentario.js';

// Inicializar el modelo de usuario
const User = userModel(sequelize, DataTypes);

// Relación entre Visita y Cafe
Visita.belongsTo(Cafe, {
  foreignKey: 'cafeteriaId',
  as: 'cafeteria'
});

Cafe.hasMany(Visita, {
  foreignKey: 'cafeteriaId',
  as: 'visitas'
});

// Relación entre Visita y VisitaImagen
Visita.hasMany(VisitaImagen, {
  foreignKey: 'visitaId',
  as: 'visitaImagenes'
});

VisitaImagen.belongsTo(Visita, {
  foreignKey: 'visitaId',
  as: 'visita'
});

// Relación entre Usuario y Visita
User.hasMany(Visita, {
  foreignKey: 'userId',
  as: 'visitas'
});

Visita.belongsTo(User, {
  foreignKey: 'userId',
  as: 'usuario'
});

export { Visita, Cafe, VisitaImagen, User }; 

// Relación entre Visita y Comentario
Visita.hasMany(Comentario, {
  foreignKey: 'visitaId',
  as: 'comentarios',
  onDelete: 'CASCADE'
});

Comentario.belongsTo(Visita, {
  foreignKey: 'visitaId',
  as: 'visita'
});

export { Visita, Cafe, VisitaImagen, Comentario }; 