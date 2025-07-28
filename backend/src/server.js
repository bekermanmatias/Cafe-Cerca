import app from './app.js';
import { testConnection } from './config/database.js';
import sequelize from './config/database.js';

const DEFAULT_PORT = 4000;
let PORT = process.env.PORT || DEFAULT_PORT;

const startServer = async () => {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    await testConnection();
    
    // Sincronizar modelos con la base de datos
    // CUIDADO: force: true borra y recrea las tablas
    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados con la base de datos');
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📋 Rutas disponibles:`);
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/api/visitas`);
      console.log(`   GET  http://localhost:${PORT}/api/cafes`);
      console.log(`   POST http://localhost:${PORT}/api/cafes`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Puerto ${PORT} en uso, intentando con puerto ${PORT + 1}`);
        PORT += 1;
        server.close();
        startServer(); // Intentar con el siguiente puerto
      } else {
        console.error('❌ Error iniciando servidor:', err.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error.message);
    process.exit(1);
  }
};

startServer();
