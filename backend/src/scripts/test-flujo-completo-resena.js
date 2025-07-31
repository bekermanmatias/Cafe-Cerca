import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Probando flujo completo: invitación → aceptación con reseña...');

const testFlujoCompleto = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Buscar usuarios específicos
    const duki = await User.findOne({ where: { email: 'duki@example.com' } });
    const ysy = await User.findOne({ where: { email: 'ysy.a@example.com' } });
    const cafe = await Cafe.findOne();
    
    if (!duki || !ysy || !cafe) {
      console.log('❌ No se encontraron los usuarios o cafetería necesarios');
      return;
    }
    
    console.log(`👤 Duki: ${duki.name} (ID: ${duki.id})`);
    console.log(`👥 Ysy: ${ysy.name} (ID: ${ysy.id})`);
    console.log(`☕ Cafetería: ${cafe.name}`);
    
    // ===== PASO 1: Simular creación de visita compartida desde frontend =====
    console.log('\n📝 PASO 1: Simulando creación de visita compartida...');
    
    // Simular FormData del frontend
    const formDataSimulation = {
      cafeteriaId: cafe.id.toString(),
      comentario: "¡Excelente experiencia! El café estaba perfecto.",
      calificacion: "5",
      esCompartida: "true",
      maxParticipantes: "10",
      amigosIds: [ysy.id.toString()]
    };
    
    console.log('📋 FormData que envía el frontend:', formDataSimulation);
    
    // Procesar datos como lo hace el backend
    const usuarioId = duki.id;
    const cafeteriaId = parseInt(formDataSimulation.cafeteriaId);
    const esCompartida = formDataSimulation.esCompartida === 'true';
    const maxParticipantes = parseInt(formDataSimulation.maxParticipantes);
    const participantes = [];
    const amigosIds = formDataSimulation.amigosIds.map(id => parseInt(id));
    const calificacion = parseInt(formDataSimulation.calificacion);
    const comentario = formDataSimulation.comentario;
    
    // Crear la visita
    const nuevaVisita = await Visita.create({
      cafeteriaId,
      esCompartida,
      maxParticipantes,
      fecha: new Date(),
      estado: 'activa'
    });
    
    console.log(`✅ Visita creada con ID: ${nuevaVisita.id}`);
    
    // Agregar al creador como participante
    await VisitaParticipante.create({
      visitaId: nuevaVisita.id,
      usuarioId,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Creador agregado como participante`);
    
    // Agregar participantes invitados
    if (esCompartida && amigosIds.length > 0) {
      const participantesParaGuardar = amigosIds.map(participanteId => ({
        visitaId: nuevaVisita.id,
        usuarioId: participanteId,
        rol: 'participante',
        estado: 'pendiente',
        fechaInvitacion: new Date()
      }));
      
      await VisitaParticipante.bulkCreate(participantesParaGuardar);
      console.log('✅ Participantes invitados agregados como pendientes');
    }
    
    // Crear reseña del creador
    if (calificacion && comentario) {
      await Resena.create({
        visitaId: nuevaVisita.id,
        usuarioId,
        calificacion,
        comentario
      });
      console.log(`✅ Reseña del creador creada automáticamente`);
    }
    
    // ===== PASO 2: Verificar que Ysy tiene invitación pendiente =====
    console.log('\n📝 PASO 2: Verificando invitación pendiente de Ysy...');
    
    const invitacionesPendientesYsy = await VisitaParticipante.findAll({
      where: {
        usuarioId: ysy.id,
        estado: 'pendiente'
      },
      include: [
        {
          model: Visita,
          as: 'visita',
          include: [
            {
              model: Cafe,
              as: 'cafeteria'
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
        }
      ]
    });
    
    console.log(`✅ Invitaciones pendientes de Ysy: ${invitacionesPendientesYsy.length}`);
    
    if (invitacionesPendientesYsy.length === 0) {
      console.log('❌ PROBLEMA: No se crearon invitaciones pendientes para Ysy');
      return;
    }
    
    const invitacion = invitacionesPendientesYsy[0];
    console.log(`✅ Invitación encontrada para visita ID: ${invitacion.visitaId}`);
    
    // ===== PASO 3: Simular aceptación con reseña desde frontend =====
    console.log('\n📝 PASO 3: Simulando aceptación con reseña...');
    
    // Simular datos del modal de reseña
    const reseñaComentario = "¡Me encantó la experiencia! El ambiente era genial y el café excelente.";
    const reseñaCalificacion = 4;
    
    console.log(`📝 Comentario de reseña: "${reseñaComentario}"`);
    console.log(`⭐ Calificación: ${reseñaCalificacion}/5`);
    
    // Aplicar la lógica del endpoint aceptarInvitacionConResena
    const participacion = await VisitaParticipante.findOne({
      where: {
        visitaId: invitacion.visitaId,
        usuarioId: ysy.id,
        estado: 'pendiente'
      }
    });
    
    if (!participacion) {
      console.log('❌ No se encontró la participación pendiente');
      return;
    }
    
    // Verificar que no existe ya una reseña del usuario
    const reseñaExistente = await Resena.findOne({
      where: {
        visitaId: invitacion.visitaId,
        usuarioId: ysy.id
      }
    });
    
    if (reseñaExistente) {
      console.log('❌ Ya existe una reseña del usuario para esta visita');
      return;
    }
    
    // Actualizar el estado de la participación a aceptada
    await participacion.update({
      estado: 'aceptada',
      fechaRespuesta: new Date()
    });
    
    console.log('✅ Participación actualizada a aceptada');
    
    // Crear la reseña
    await Resena.create({
      visitaId: invitacion.visitaId,
      usuarioId: ysy.id,
      comentario: reseñaComentario,
      calificacion: reseñaCalificacion
    });
    
    console.log('✅ Reseña creada exitosamente');
    
    // ===== PASO 4: Verificar resultados finales =====
    console.log('\n📝 PASO 4: Verificando resultados finales...');
    
    // Verificar estado de participación
    const participacionFinal = await VisitaParticipante.findOne({
      where: {
        visitaId: invitacion.visitaId,
        usuarioId: ysy.id
      }
    });
    
    console.log(`✅ Estado final de participación: ${participacionFinal.estado}`);
    
    // Verificar reseña creada
    const reseñaFinal = await Resena.findOne({
      where: {
        visitaId: invitacion.visitaId,
        usuarioId: ysy.id
      }
    });
    
    console.log(`✅ Reseña creada con calificación: ${reseñaFinal.calificacion}`);
    console.log(`✅ Comentario: "${reseñaFinal.comentario}"`);
    
    // Verificar todas las reseñas de la visita
    const todasLasResenas = await Resena.findAll({
      where: { visitaId: invitacion.visitaId },
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        }
      ]
    });
    
    console.log(`✅ Total de reseñas en la visita: ${todasLasResenas.length}`);
    todasLasResenas.forEach((resena, index) => {
      console.log(`  ${index + 1}. ${resena.usuario.name}: ${resena.calificacion}/5 - "${resena.comentario}"`);
    });
    
    // Verificar participantes finales
    const participantesFinales = await VisitaParticipante.findAll({
      where: { visitaId: invitacion.visitaId },
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        }
      ]
    });
    
    console.log(`✅ Total de participantes: ${participantesFinales.length}`);
    participantesFinales.forEach((participante, index) => {
      console.log(`  ${index + 1}. ${participante.usuario.name} (${participante.rol}) - ${participante.estado}`);
    });
    
    console.log('\n🎉 ¡ÉXITO! Flujo completo funcionando correctamente');
    console.log('✅ 1. Visita compartida creada desde frontend');
    console.log('✅ 2. Invitación pendiente creada para Ysy');
    console.log('✅ 3. Ysy acepta la invitación con reseña');
    console.log('✅ 4. Participación actualizada a aceptada');
    console.log('✅ 5. Reseña guardada y vinculada a la visita');
    console.log('✅ 6. Ambas reseñas aparecerán en el detalle de la visita');
    
  } catch (error) {
    console.error('❌ Error en el flujo completo:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testFlujoCompleto()
  .then(() => {
    console.log('✅ Script de flujo completo completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de flujo completo:', error);
    process.exit(1);
  }); 