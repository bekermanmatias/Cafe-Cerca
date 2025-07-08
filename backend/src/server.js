import app from './app.js';
import { testConnection } from './config/database.js';
import sequelize from './config/database.js';

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    await testConnection();
    
    // Sincronizar modelos con la base de datos
    // CUIDADO: force: true borra y recrea las tablas
    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados con la base de datos');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📋 Rutas disponibles:`);
      console.log(`   GET  http://localhost:${PORT}/`);
      console.log(`   GET  http://localhost:${PORT}/api/example`);
      console.log(`   POST http://localhost:${PORT}/api/example`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error.message);
    process.exit(1);
  }
};

startServer();