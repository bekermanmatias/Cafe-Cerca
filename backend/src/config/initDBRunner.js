import { initDatabase } from '../config/initDatabase.js';

initDatabase()
  .then(() => {
    console.log('🚀 Inicialización completada');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error en inicialización:', err);
    process.exit(1);
  });
