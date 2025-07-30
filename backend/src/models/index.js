// models/index.js
import Visita from './Visita.js';
import Cafe from './Cafe.js';
import VisitaImagen from './VisitaImagen.js';
import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import userModel from './user.js';
import Comentario from './Comentario.js'; // clase extendida Model con init llamado dentro
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
  foreignKey: 'userId',
  as: 'visitas'
});
Visita.belongsTo(User, {
  foreignKey: 'userId',
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

// Sincronizar tablas en la base de datos
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Tablas sincronizadas correctamente'))
  .catch((err) => console.error('❌ Error sincronizando tablas:', err));

export {
  Visita,
  Cafe,
  VisitaImagen,
  User,
  Comentario,
  Amigos
};
