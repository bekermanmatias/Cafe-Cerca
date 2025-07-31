import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Simulando creación de visita compartida desde frontend...');

const testFrontendVisitaCompartida = async () => {
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
    
    // ===== PASO 1: Simular datos que enviaría el frontend =====
    console.log('\n📝 PASO 1: Simulando datos del frontend...');
    
    // Simular datos que enviaría el frontend
    const frontendData = {
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
      amigosIds: [ysy.id], // Ysy como participante
      calificacion: 5,
      comentario: "¡Excelente experiencia! El café estaba perfecto."
    };
    
    console.log('📋 Datos que enviaría el frontend:', JSON.stringify(frontendData, null, 2));
    
    // ===== PASO 2: Simular el proceso del controlador =====
    console.log('\n📝 PASO 2: Simulando proceso del controlador...');
    
    const usuarioId = duki.id; // Simular que Duki es el usuario autenticado
    const { 
      cafeteriaId, 
      esCompartida = false, 
      maxParticipantes = 10, 
      participantes = [],
      amigosIds = [], 
      calificacion, 
      comentario 
    } = frontendData;
    
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
    
    // ===== PASO 7: Verificar resultados =====
    console.log('\n📝 PASO 7: Verificando resultados...');
    
    const invitacionesCreadas = await VisitaParticipante.findAll({
      where: {
        visitaId: nuevaVisita.id
      },
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    console.log(`✅ Total de participantes en la visita: ${invitacionesCreadas.length}`);
    invitacionesCreadas.forEach((participacion, index) => {
      console.log(`  ${index + 1}. ${participacion.usuario.name} (${participacion.usuario.email}) - Rol: ${participacion.rol} - Estado: ${participacion.estado}`);
    });
    
    // ===== PASO 8: Verificar invitaciones pendientes de Ysy =====
    console.log('\n📝 PASO 8: Verificando invitaciones pendientes de Ysy...');
    
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
    
  } catch (error) {
    console.error('❌ Error en la simulación:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testFrontendVisitaCompartida()
  .then(() => {
    console.log('✅ Script de simulación completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de simulación:', error);
    process.exit(1);
  }); 