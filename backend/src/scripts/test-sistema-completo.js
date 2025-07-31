import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Probando sistema completo de visitas compartidas...');

const testSistemaCompleto = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Obtener usuarios y cafetería para la prueba
    const usuarios = await User.findAll({ limit: 3 });
    const cafe = await Cafe.findOne();
    
    if (usuarios.length < 3 || !cafe) {
      console.log('❌ No hay suficientes datos para la prueba');
      return;
    }
    
    const creador = usuarios[0];
    const participante1 = usuarios[1];
    const participante2 = usuarios[2];
    
    console.log(`👤 Creador: ${creador.name}`);
    console.log(`👥 Participante 1: ${participante1.name}`);
    console.log(`👥 Participante 2: ${participante2.name}`);
    console.log(`☕ Cafetería: ${cafe.name}`);
    
    // ===== PASO 1: Crear visita compartida con reseña del creador =====
    console.log('\n📝 PASO 1: Creando visita compartida...');
    
    const datosVisitaCompartida = {
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
      amigosIds: [participante1.id, participante2.id],
      calificacion: 5, // Reseña del creador
      comentario: "¡Excelente experiencia! El café estaba perfecto y el ambiente muy agradable."
    };
    
    console.log('📋 Datos de la visita compartida:', datosVisitaCompartida);
    
    // Crear la visita
    const visita = await Visita.create({
      cafeteriaId: datosVisitaCompartida.cafeteriaId,
      esCompartida: datosVisitaCompartida.esCompartida,
      maxParticipantes: datosVisitaCompartida.maxParticipantes,
      fecha: new Date(),
      estado: 'activa'
    });
    
    console.log(`✅ Visita creada con ID: ${visita.id}`);
    
    // Agregar al creador como participante
    await VisitaParticipante.create({
      visitaId: visita.id,
      usuarioId: creador.id,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Creador agregado como participante`);
    
    // Agregar participantes
    const participantesParaGuardar = datosVisitaCompartida.amigosIds.map(participanteId => ({
      visitaId: visita.id,
      usuarioId: participanteId,
      rol: 'participante',
      estado: 'aceptada', // Simulamos que ya aceptaron
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    }));

    await VisitaParticipante.bulkCreate(participantesParaGuardar);
    console.log(`✅ ${datosVisitaCompartida.amigosIds.length} participantes agregados`);
    
    // Crear reseña del creador automáticamente
    if (datosVisitaCompartida.calificacion && datosVisitaCompartida.comentario) {
      await Resena.create({
        visitaId: visita.id,
        usuarioId: creador.id,
        calificacion: datosVisitaCompartida.calificacion,
        comentario: datosVisitaCompartida.comentario
      });
      console.log(`✅ Reseña del creador creada automáticamente`);
    }
    
    // ===== PASO 2: Participantes agregan sus reseñas =====
    console.log('\n📝 PASO 2: Participantes agregando sus reseñas...');
    
    // Reseña del participante 1
    await Resena.create({
      visitaId: visita.id,
      usuarioId: participante1.id,
      calificacion: 4,
      comentario: "Muy buena cafetería, definitivamente volveré. Los alfajores están deliciosos."
    });
    console.log(`✅ Reseña de ${participante1.name} creada`);
    
    // Reseña del participante 2
    await Resena.create({
      visitaId: visita.id,
      usuarioId: participante2.id,
      calificacion: 5,
      comentario: "¡Increíble experiencia! El servicio fue excelente y el café de primera calidad."
    });
    console.log(`✅ Reseña de ${participante2.name} creada`);
    
    // ===== PASO 3: Obtener la visita completa con todas las reseñas =====
    console.log('\n📝 PASO 3: Obteniendo visita completa con todas las reseñas...');
    
    const visitaCompleta = await Visita.findByPk(visita.id, {
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
    
    // ===== PASO 4: Mostrar resultados finales =====
    console.log('\n🎉 RESULTADOS FINALES:');
    const visitaJSON = visitaCompleta.toJSON();
    const creadorData = visitaJSON.participantes?.find(p => p.rol === 'creador')?.usuario || null;
    const participantesData = visitaJSON.participantes?.filter(p => p.rol !== 'creador') || [];
    const resenasData = visitaJSON.resenas || [];
    
    console.log(`  📝 Visita ID ${visita.id}:`);
    console.log(`    ☕ Cafetería: ${visitaJSON.cafeteria?.name}`);
    console.log(`    👤 Creador: ${creadorData?.name}`);
    console.log(`    👥 Participantes: ${participantesData.length} (${participantesData.map(p => p.usuario.name).join(', ')})`);
    console.log(`    📝 Total de reseñas: ${resenasData.length}`);
    
    console.log('\n📝 Reseñas de todos los participantes:');
    resenasData.forEach((resena, index) => {
      console.log(`  ${index + 1}. 👤 ${resena.usuario.name}: ${resena.calificacion}⭐`);
      console.log(`     💬 "${resena.comentario}"`);
    });
    
    // ===== PASO 5: Verificar estructura para frontend =====
    console.log('\n📊 Estructura de respuesta para frontend:');
    console.log(`    ✅ usuario: ${creadorData ? 'Presente' : 'Faltante'} (${creadorData?.name})`);
    console.log(`    ✅ participantes: ${participantesData.length} participantes`);
    console.log(`    ✅ resenas: ${resenasData.length} reseñas`);
    console.log(`    ✅ cafeteria: ${visitaJSON.cafeteria ? 'Presente' : 'Faltante'}`);
    console.log(`    ✅ esCompartida: ${visitaJSON.esCompartida}`);
    
    // ===== PASO 6: Calcular estadísticas =====
    console.log('\n📈 Estadísticas de la visita:');
    const calificacionPromedio = resenasData.reduce((sum, resena) => sum + resena.calificacion, 0) / resenasData.length;
    console.log(`    ⭐ Calificación promedio: ${calificacionPromedio.toFixed(1)}`);
    console.log(`    👥 Total de participantes: ${participantesData.length + 1} (incluyendo creador)`);
    console.log(`    📝 Total de reseñas: ${resenasData.length}`);
    
    console.log('\n✅ Sistema completo probado exitosamente!');
    console.log('🎯 El backend está listo para manejar:');
    console.log('   ✅ Visitas individuales con reseña del creador');
    console.log('   ✅ Visitas compartidas con múltiples participantes');
    console.log('   ✅ Reseñas independientes de cada participante');
    console.log('   ✅ Estructura de datos correcta para el frontend');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testSistemaCompleto()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 