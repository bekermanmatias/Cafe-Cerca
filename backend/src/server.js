import app from './app.js';
import { initializeDatabase } from './config/initDatabase.js';

const PORT = process.env.PORT || 3000;

// Inicializar la base de datos y el servidor
const startServer = async () => {
  try {
    // Inicializar la base de datos y ejecutar migraciones pendientes
    await initializeDatabase();

    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
