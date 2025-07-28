import app from './app.js';
import sequelize from './config/database.js';
import { Cafe, Visita, VisitaImagen, Comentario } from './models/index.js';

const PORT = process.env.PORT || 3000;

// Función para sincronizar los modelos en orden
const syncModels = async () => {
  try {
    // Primero sincronizamos Cafe
    await Cafe.sync({ alter: true });
    console.log('✅ Tabla Cafe sincronizada');

    // Luego Visita que depende de Cafe
    await Visita.sync({ alter: true });
    console.log('✅ Tabla Visita sincronizada');

    // Luego VisitaImagen que depende de Visita
    await VisitaImagen.sync({ alter: true });
    console.log('✅ Tabla VisitaImagen sincronizada');

    // Finalmente Comentario que depende de Visita
    await Comentario.sync({ alter: true });
    console.log('✅ Tabla Comentario sincronizada');

    return true;
  } catch (error) {
    console.error('❌ Error sincronizando las tablas:', error);
    return false;
  }
};

// Iniciar el servidor
syncModels()
  .then(success => {
    if (success) {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      });
    } else {
      console.error('❌ No se pudo iniciar el servidor debido a errores en la sincronización');
      process.exit(1);
    }
  });
