import app from './app.js';
import { initDatabase } from './config/initDatabase.js';

const PORT = process.env.PORT || 3000;

// Inicializar la base de datos y luego iniciar el servidor
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  });
