import Visita from './Visita.js';
import Cafe from './Cafe.js';
import VisitaImagen from './VisitaImagen.js';

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
  as: 'visitaImagenes' // Cambiamos el alias para evitar conflictos
});

VisitaImagen.belongsTo(Visita, {
  foreignKey: 'visitaId',
  as: 'visita'
});

export { Visita, Cafe, VisitaImagen }; 
