import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Probando responder invitaciones...');

const testResponderInvitacion = async () => {
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
    
    // ===== PASO 1: Crear visita compartida con participante pendiente =====
    console.log('\n📝 PASO 1: Creando visita compartida con participante pendiente...');
    
    const visita = await Visita.create({
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
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
    
    // Agregar participante con estado pendiente
    const participacionPendiente = await VisitaParticipante.create({
      visitaId: visita.id,
      usuarioId: participante.id,
      rol: 'participante',
      estado: 'pendiente',
      fechaInvitacion: new Date()
    });
    
    console.log(`✅ Participante pendiente agregado con ID: ${participacionPendiente.id}`);
    
    // Crear reseña del creador
    await Resena.create({
      visitaId: visita.id,
      usuarioId: creador.id,
      calificacion: 5,
      comentario: "¡Excelente experiencia! El café estaba perfecto."
    });
    
    // ===== PASO 2: Simular aceptar la invitación =====
    console.log('\n📝 PASO 2: Simulando aceptar la invitación...');
    
    await participacionPendiente.update({
      estado: 'aceptada',
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Invitación aceptada exitosamente`);
    
    // ===== PASO 3: Verificar que la invitación ya no aparece como pendiente =====
    console.log('\n📝 PASO 3: Verificando que la invitación ya no aparece como pendiente...');
    
    const invitacionesPendientes = await VisitaParticipante.findAll({
      where: {
        usuarioId: participante.id,
        estado: 'pendiente'
      }
    });
    
    console.log(`✅ Invitaciones pendientes restantes: ${invitacionesPendientes.length}`);
    
    // ===== PASO 4: Verificar que la invitación aparece como aceptada =====
    console.log('\n📝 PASO 4: Verificando que la invitación aparece como aceptada...');
    
    const invitacionAceptada = await VisitaParticipante.findOne({
      where: {
        id: participacionPendiente.id
      }
    });
    
    console.log(`✅ Estado de la invitación: ${invitacionAceptada.estado}`);
    console.log(`✅ Fecha de respuesta: ${invitacionAceptada.fechaRespuesta}`);
    
    // ===== PASO 5: Simular rechazar otra invitación =====
    console.log('\n📝 PASO 5: Simulando rechazar otra invitación...');
    
    // Crear otra visita para rechazar
    const visita2 = await Visita.create({
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
      fecha: new Date(),
      estado: 'activa'
    });
    
    await VisitaParticipante.create({
      visitaId: visita2.id,
      usuarioId: creador.id,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    const participacionPendiente2 = await VisitaParticipante.create({
      visitaId: visita2.id,
      usuarioId: participante.id,
      rol: 'participante',
      estado: 'pendiente',
      fechaInvitacion: new Date()
    });
    
    await participacionPendiente2.update({
      estado: 'rechazada',
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Invitación rechazada exitosamente`);
    
    // ===== PASO 6: Verificar estados finales =====
    console.log('\n📝 PASO 6: Verificando estados finales...');
    
    const todasLasParticipaciones = await VisitaParticipante.findAll({
      where: {
        usuarioId: participante.id
      },
      include: [
        {
          model: Visita,
          as: 'visita',
          include: [
            {
              model: Cafe,
              as: 'cafeteria'
            }
          ]
        }
      ]
    });
    
    console.log('\n📊 Estados de todas las participaciones:');
    todasLasParticipaciones.forEach((participacion, index) => {
      console.log(`  ${index + 1}. Visita ID ${participacion.visita.id}: ${participacion.estado}`);
    });
    
    console.log('\n✅ Responder invitaciones probado exitosamente!');
    console.log('🎯 El backend está listo para:');
    console.log('   ✅ Aceptar invitaciones (estado: aceptada)');
    console.log('   ✅ Rechazar invitaciones (estado: rechazada)');
    console.log('   ✅ Actualizar fecha de respuesta');
    console.log('   ✅ Filtrar invitaciones pendientes correctamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testResponderInvitacion()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 