import app from './app.js';
import { initDatabase } from './config/initDatabase.js';

const PORT = process.env.PORT || 3000;

// Inicializar la base de datos y luego iniciar el servidor
initDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🌐 Servidor accesible desde cualquier IP en el puerto ${PORT}`);
    });
  })
  .catch(error => {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  });
