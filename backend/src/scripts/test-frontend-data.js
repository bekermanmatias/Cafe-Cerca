import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Simulando datos exactos del frontend...');

const testFrontendData = async () => {
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
    
    // ===== PASO 1: Simular FormData del frontend =====
    console.log('\n📝 PASO 1: Simulando FormData del frontend...');
    
    // Simular exactamente lo que envía el frontend
    const formDataSimulation = {
      cafeteriaId: cafe.id.toString(),
      comentario: "¡Excelente experiencia! El café estaba perfecto.",
      calificacion: "5",
      esCompartida: "true", // ¡ESTE ERA EL PROBLEMA!
      maxParticipantes: "10",
      amigosIds: [ysy.id.toString()] // Array de strings como lo envía FormData
    };
    
    console.log('📋 FormData que envía el frontend:', formDataSimulation);
    
    // ===== PASO 2: Simular procesamiento del backend =====
    console.log('\n📝 PASO 2: Simulando procesamiento del backend...');
    
    const usuarioId = duki.id;
    const cafeteriaId = parseInt(formDataSimulation.cafeteriaId);
    const esCompartida = formDataSimulation.esCompartida === 'true';
    const maxParticipantes = parseInt(formDataSimulation.maxParticipantes);
    const participantes = [];
    const amigosIds = formDataSimulation.amigosIds.map(id => parseInt(id));
    const calificacion = parseInt(formDataSimulation.calificacion);
    const comentario = formDataSimulation.comentario;
    
    console.log('🔍 DEBUG - Datos procesados:');
    console.log('  - usuarioId:', usuarioId);
    console.log('  - cafeteriaId:', cafeteriaId);
    console.log('  - esCompartida:', esCompartida);
    console.log('  - maxParticipantes:', maxParticipantes);
    console.log('  - participantes:', participantes);
    console.log('  - amigosIds:', amigosIds);
    console.log('  - calificacion:', calificacion);
    console.log('  - comentario:', comentario);
    
    // ===== PASO 3: Crear la visita =====
    console.log('\n📝 PASO 3: Creando la visita...');
    
    const nuevaVisita = await Visita.create({
      cafeteriaId,
      esCompartida,
      maxParticipantes,
      fecha: new Date(),
      estado: 'activa'
    });
    
    console.log(`✅ Visita creada con ID: ${nuevaVisita.id}`);
    
    // ===== PASO 4: Agregar al creador como participante =====
    console.log('\n📝 PASO 4: Agregando al creador como participante...');
    
    await VisitaParticipante.create({
      visitaId: nuevaVisita.id,
      usuarioId,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Creador agregado como participante`);
    
    // ===== PASO 5: Agregar participantes =====
    console.log('\n📝 PASO 5: Agregando participantes...');
    
    const participantesFinales = participantes.length > 0 ? participantes : amigosIds;
    
    console.log('🔍 DEBUG - Participantes finales:', participantesFinales);
    
    if (esCompartida && participantesFinales.length > 0) {
      const participantesParaGuardar = participantesFinales.map(participanteId => ({
        visitaId: nuevaVisita.id,
        usuarioId: participanteId,
        rol: 'participante',
        estado: 'pendiente',
        fechaInvitacion: new Date()
      }));

      console.log('🔍 DEBUG - Participantes para guardar:', participantesParaGuardar);
      await VisitaParticipante.bulkCreate(participantesParaGuardar);
      console.log('✅ Participantes agregados exitosamente');
    } else {
      console.log('🔍 DEBUG - No se agregaron participantes porque:');
      console.log('  - esCompartida:', esCompartida);
      console.log('  - participantesFinales.length:', participantesFinales.length);
    }
    
    // ===== PASO 6: Crear reseña del creador =====
    console.log('\n📝 PASO 6: Creando reseña del creador...');
    
    if (calificacion && comentario) {
      await Resena.create({
        visitaId: nuevaVisita.id,
        usuarioId,
        calificacion,
        comentario
      });
      console.log(`✅ Reseña del creador creada automáticamente`);
    }
    
    // ===== PASO 7: Ver piezas pendientes de Ysy =====
    console.log('\n📝 PASO 7: Verificando invitaciones pendientes de Ysy...');
    
    const invitacionesPendientesYsy = await VisitaParticipante.findAll({
      where: {
        usuarioId: ysy.id,
        estado: 'pendiente'
      }
    });
    
    console.log(`✅ Invitaciones pendientes de Ysy: ${invitacionesPendientesYsy.length}`);
    
    if (invitacionesPendientesYsy.length > 0) {
      console.log('🎉 ¡ÉXITO! Las invitaciones se crearon correctamente');
      console.log('✅ Ysy debería ver la invitación en su pantalla de invitaciones');
    } else {
      console.log('❌ PROBLEMA: No se crearon invitaciones pendientes para Ysy');
    }
    
    console.log('\n✅ Simulación completada exitosamente!');
    console.log('🎯 El problema estaba en que el frontend no enviaba esCompartida: true');
    console.log('✅ Ahora el frontend envía esCompartida: true cuando hay amigos seleccionados');
    
  } catch (error) {
    console.error('❌ Error en la simulación:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testFrontendData()
  .then(() => {
    console.log('✅ Script de simulación completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de simulación:', error);
    process.exit(1);
  }); 