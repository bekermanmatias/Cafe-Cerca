import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, Resena, User, Cafe } from '../models/index.js';

console.log('🧪 Iniciando prueba de reseña...');

const testResena = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Obtener la visita compartida que creamos antes
    const visita = await Visita.findOne({
      where: { esCompartida: true },
      include: [
        {
          model: VisitaParticipante,
          as: 'participantes',
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
    
    if (!visita) {
      console.log('❌ No hay visitas compartidas para probar');
      return;
    }
    
    console.log(`📝 Probando reseñas para visita ID: ${visita.id}`);
    
    // Obtener participantes
    const participantes = visita.participantes || [];
    const creador = participantes.find(p => p.rol === 'creador');
    const participante = participantes.find(p => p.rol === 'participante');
    
    if (!creador || !participante) {
      console.log('❌ No hay suficientes participantes para la prueba');
      return;
    }
    
    console.log(`👤 Creador: ${creador.usuario.name}`);
    console.log(`👥 Participante: ${participante.usuario.name}`);
    
    // Crear reseña del creador
    const resenaCreador = await Resena.create({
      visitaId: visita.id,
      usuarioId: creador.usuarioId,
      calificacion: 5,
      comentario: '¡Excelente experiencia! El café estaba perfecto y el ambiente muy agradable.'
    });
    
    console.log(`✅ Reseña del creador creada con ID: ${resenaCreador.id}`);
    
    // Crear reseña del participante
    const resenaParticipante = await Resena.create({
      visitaId: visita.id,
      usuarioId: participante.usuarioId,
      calificacion: 4,
      comentario: 'Muy buena cafetería, definitivamente volveré. Los alfajores están deliciosos.'
    });
    
    console.log(`✅ Reseña del participante creada con ID: ${resenaParticipante.id}`);
    
    // Obtener la visita con reseñas
    const visitaConResenas = await Visita.findByPk(visita.id, {
      include: [
        {
          model: Cafe,
          as: 'cafeteria',
          attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'tags', 'openingHours']
        },
        {
          model: VisitaParticipante,
          as: 'participantes',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        },
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
    
    console.log('📋 Datos de la visita con reseñas:');
    console.log(JSON.stringify(visitaConResenas.toJSON(), null, 2));
    
    // Mostrar reseñas
    const visitaJSON = visitaConResenas.toJSON();
    console.log('📝 Reseñas:');
    visitaJSON.resenas?.forEach(resena => {
      console.log(`  👤 ${resena.usuario.name}: ${resena.calificacion}⭐ - "${resena.comentario}"`);
    });
    
    console.log('✅ Prueba de reseñas completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testResena()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 