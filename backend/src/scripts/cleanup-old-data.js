import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, VisitaImagen, Like, Comentario } from '../models/index.js';

console.log('🚀 Iniciando script de limpieza...');

const cleanupOldData = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    console.log('🧹 Iniciando limpieza de datos antiguos...');
    
    // 1. Eliminar todas las visitas existentes
    console.log('📝 Eliminando visitas...');
    const deletedVisitas = await Visita.destroy({
      where: {}
    });
    console.log(`✅ Eliminadas ${deletedVisitas} visitas antiguas`);
    
    // 2. Limpiar tabla de participantes
    console.log('👥 Eliminando participantes...');
    const deletedParticipantes = await VisitaParticipante.destroy({
      where: {}
    });
    console.log(`✅ Eliminados ${deletedParticipantes} participantes antiguos`);
    
    // 3. Limpiar imágenes
    console.log('🖼️ Eliminando imágenes...');
    const deletedImagenes = await VisitaImagen.destroy({
      where: {}
    });
    console.log(`✅ Eliminadas ${deletedImagenes} imágenes antiguas`);
    
    // 4. Limpiar likes
    console.log('❤️ Eliminando likes...');
    const deletedLikes = await Like.destroy({
      where: {}
    });
    console.log(`✅ Eliminados ${deletedLikes} likes antiguos`);
    
    // 5. Limpiar comentarios
    console.log('💬 Eliminando comentarios...');
    const deletedComentarios = await Comentario.destroy({
      where: {}
    });
    console.log(`✅ Eliminados ${deletedComentarios} comentarios antiguos`);
    
    console.log('🎉 Limpieza completada exitosamente!');
    console.log('📝 Ahora puedes crear nuevas visitas con la estructura correcta');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

// Ejecutar el script
cleanupOldData()
  .then(() => {
    console.log('✅ Script de limpieza completado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de limpieza:', error);
    process.exit(1);
  }); 