import sequelize from '../config/database.js';
import { Visita, Resena, User } from '../models/index.js';

console.log('🧪 Probando obtener reseñas...');

const testGetResenas = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Obtener todas las reseñas
    const resenas = await Resena.findAll({
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        }
      ]
    });
    
    console.log(`📝 Encontradas ${resenas.length} reseñas:`);
    resenas.forEach(resena => {
      console.log(`  👤 ${resena.usuario.name}: ${resena.calificacion}⭐ - "${resena.comentario}"`);
    });
    
    // Obtener una visita con reseñas
    const visita = await Visita.findByPk(11, {
      include: [
        {
          model: Resena,
          as: 'resenas',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        }
      ]
    });
    
    if (visita) {
      console.log(`\n📋 Visita ID ${visita.id} con reseñas:`);
      const visitaJSON = visita.toJSON();
      visitaJSON.resenas?.forEach(resena => {
        console.log(`  👤 ${resena.usuario.name}: ${resena.calificacion}⭐ - "${resena.comentario}"`);
      });
    }
    
    console.log('✅ Prueba de obtención de reseñas completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testGetResenas()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 