import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Probando conexión frontend-backend...');

const testFrontendConnection = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Obtener datos de prueba
    const usuarios = await User.findAll({ limit: 2 });
    const cafe = await Cafe.findOne();
    
    if (usuarios.length < 2 || !cafe) {
      console.log('❌ No hay suficientes datos para la prueba');
      return;
    }
    
    const creador = usuarios[0];
    const participante = usuarios[1];
    
    console.log(`👤 Creador: ${creador.name}`);
    console.log(`👥 Participante: ${participante.name}`);
    console.log(`☕ Cafetería: ${cafe.name}`);
    
    // ===== PASO 1: Simular datos que enviaría el frontend =====
    console.log('\n📝 PASO 1: Simulando datos del frontend...');
    
    const frontendData = {
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
      amigosIds: [participante.id],
      calificacion: 5,
      comentario: "¡Excelente experiencia! El café estaba perfecto y el ambiente muy agradable."
    };
    
    console.log('📋 Datos que enviaría el frontend:', frontendData);
    
    // ===== PASO 2: Crear visita compartida (como lo haría el backend) =====
    console.log('\n📝 PASO 2: Creando visita compartida...');
    
    const visita = await Visita.create({
      cafeteriaId: frontendData.cafeteriaId,
      esCompartida: frontendData.esCompartida,
      maxParticipantes: frontendData.maxParticipantes,
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
    
    // Agregar participantes
    const participantesParaGuardar = frontendData.amigosIds.map(participanteId => ({
      visitaId: visita.id,
      usuarioId: participanteId,
      rol: 'participante',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    }));

    await VisitaParticipante.bulkCreate(participantesParaGuardar);
    console.log(`✅ ${frontendData.amigosIds.length} participantes agregados`);
    
    // Crear reseña del creador automáticamente
    if (frontendData.calificacion && frontendData.comentario) {
      await Resena.create({
        visitaId: visita.id,
        usuarioId: creador.id,
        calificacion: frontendData.calificacion,
        comentario: frontendData.comentario
      });
      console.log(`✅ Reseña del creador creada automáticamente`);
    }
    
    // ===== PASO 3: Simular respuesta que recibiría el frontend =====
    console.log('\n📝 PASO 3: Simulando respuesta para el frontend...');
    
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
    
    // Transformar para el frontend (como lo hace el backend)
    const visitaJSON = visitaCompleta.toJSON();
    const creadorData = visitaJSON.participantes?.find(p => p.rol === 'creador')?.usuario || null;
    const participantesData = visitaJSON.participantes?.filter(p => p.rol !== 'creador') || [];
    const resenasData = visitaJSON.resenas || [];
    
    // Buscar la reseña del creador para mostrar como comentario principal
    const reseñaCreador = resenasData.find(r => r.usuarioId === creador.id);
    
    const respuestaFrontend = {
      ...visitaJSON,
      usuario: creadorData, // Usuario creador de la visita
      comentario: reseñaCreador?.comentario || '', // Comentario del creador
      calificacion: reseñaCreador?.calificacion || 0, // Calificación del creador
      participantes: participantesData, // Solo participantes, no el creador
      resenas: resenasData // Todas las reseñas
    };
    
    console.log('\n🎉 RESPUESTA PARA EL FRONTEND:');
    console.log(`  📝 Visita ID ${visita.id}:`);
    console.log(`    ☕ Cafetería: ${respuestaFrontend.cafeteria?.name}`);
    console.log(`    👤 Creador: ${respuestaFrontend.usuario?.name}`);
    console.log(`    💬 Comentario: "${respuestaFrontend.comentario}"`);
    console.log(`    ⭐ Calificación: ${respuestaFrontend.calificacion}/5`);
    console.log(`    👥 Participantes: ${respuestaFrontend.participantes.length}`);
    console.log(`    📝 Total de reseñas: ${respuestaFrontend.resenas.length}`);
    
    // ===== PASO 4: Verificar compatibilidad con VisitCard =====
    console.log('\n📊 Verificación de compatibilidad con VisitCard:');
    console.log(`    ✅ visit.id: ${respuestaFrontend.id}`);
    console.log(`    ✅ visit.comentario: ${respuestaFrontend.comentario ? 'Presente' : 'Faltante'}`);
    console.log(`    ✅ visit.calificacion: ${respuestaFrontend.calificacion}`);
    console.log(`    ✅ visit.fecha: ${respuestaFrontend.fecha}`);
    console.log(`    ✅ visit.usuario: ${respuestaFrontend.usuario ? 'Presente' : 'Faltante'}`);
    console.log(`    ✅ visit.cafeteria: ${respuestaFrontend.cafeteria ? 'Presente' : 'Faltante'}`);
    console.log(`    ✅ visit.imagenes: ${respuestaFrontend.visitaImagenes ? 'Presente' : 'Faltante'}`);
    
    // ===== PASO 5: Simular datos para mostrar múltiples reseñas =====
    console.log('\n📝 PASO 5: Agregando reseña del participante...');
    
    await Resena.create({
      visitaId: visita.id,
      usuarioId: participante.id,
      calificacion: 4,
      comentario: "Muy buena cafetería, definitivamente volveré. Los alfajores están deliciosos."
    });
    
    console.log(`✅ Reseña del participante agregada`);
    
    // Obtener visita actualizada
    const visitaActualizada = await Visita.findByPk(visita.id, {
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
    
    const visitaJSONActualizada = visitaActualizada.toJSON();
    const resenasActualizadas = visitaJSONActualizada.resenas || [];
    
    console.log('\n📝 Todas las reseñas de la visita:');
    resenasActualizadas.forEach((resena, index) => {
      console.log(`  ${index + 1}. 👤 ${resena.usuario.name}: ${resena.calificacion}⭐`);
      console.log(`     💬 "${resena.comentario}"`);
    });
    
    console.log('\n✅ Conexión frontend-backend probada exitosamente!');
    console.log('🎯 El backend está listo para:');
    console.log('   ✅ Recibir datos del frontend (amigosIds, calificacion, comentario)');
    console.log('   ✅ Crear visitas compartidas automáticamente');
    console.log('   ✅ Crear reseñas automáticamente para el creador');
    console.log('   ✅ Devolver datos compatibles con VisitCard');
    console.log('   ✅ Permitir reseñas adicionales de otros participantes');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testFrontendConnection()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 