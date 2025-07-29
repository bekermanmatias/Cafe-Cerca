import app from './app.js';
import { initDatabase } from './config/initDatabase.js';

const PORT = process.env.PORT || 3000;

// Iniciar el servidor
initDatabase()
  .then(success => {
    if (success) {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      });
    } else {
      console.error('❌ No se pudo iniciar el servidor debido a errores en la base de datos');
      process.exit(1);
    }
  });
