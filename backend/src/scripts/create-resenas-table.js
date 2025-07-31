import sequelize from '../config/database.js';
import { Resena } from '../models/index.js';

console.log('🔧 Creando tabla resenas...');

const createResenasTable = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Verificar si la tabla existe
    try {
      await sequelize.query('DESCRIBE resenas');
      console.log('✅ La tabla resenas ya existe');
    } catch (error) {
      console.log('📝 La tabla resenas no existe, creándola...');
      
      // Crear la tabla
      await sequelize.query(`
        CREATE TABLE resenas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          visitaId INT NOT NULL,
          usuarioId INT NOT NULL,
          calificacion INT NOT NULL,
          mensaje TEXT,
          imagenUrl VARCHAR(255),
          fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_visita_usuario (visitaId, usuarioId),
          FOREIGN KEY (visitaId) REFERENCES visitas(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (usuarioId) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      
      console.log('✅ Tabla resenas creada exitosamente');
    }
    
    // Verificar la estructura
    const [columns] = await sequelize.query('DESCRIBE resenas');
    console.log('📋 Estructura de la tabla resenas:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error creando tabla resenas:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

createResenasTable()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script:', error);
    process.exit(1);
  }); 