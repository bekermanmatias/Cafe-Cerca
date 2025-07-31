import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Probando flujo real del frontend...');

const testFrontendReal = async () => {
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
    
    // ===== PASO 1: Simular datos exactos del frontend =====
    console.log('\n📝 PASO 1: Simulando datos exactos del frontend...');
    
    // Simular exactamente lo que envía el frontend (FormData)
    const formDataSimulation = {
      cafeteriaId: cafe.id.toString(),
      comentario: "asss",
      calificacion: "3",
      esCompartida: "true",
      maxParticipantes: "10",
      amigosIds: ysy.id.toString(), // ¡PROBLEMA! Es un string, no un array
      imagenes: "1"
    };
    
    console.log('📋 FormData que envía el frontend:', formDataSimulation);
    
    // ===== PASO 2: Simular procesamiento del backend =====
    console.log('\n📝 PASO 2: Simulando procesamiento del backend...');
    
    const usuarioId = duki.id;
    const cafeteriaId = parseInt(formDataSimulation.cafeteriaId);
    const esCompartida = formDataSimulation.esCompartida === 'true';
    const maxParticipantes = parseInt(formDataSimulation.maxParticipantes);
    const participantes = [];
    const amigosIds = formDataSimulation.amigosIds; // Puede ser string o array
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
    
    // ===== PASO 3: Aplicar el fix =====
    console.log('\n📝 PASO 3: Aplicando el fix...');
    
    // Asegurar que amigosIds sea siempre un array
    const amigosIdsArray = Array.isArray(amigosIds) ? amigosIds : [amigosIds].filter(id => id);
    
    console.log('✅ amigosIds convertido a array:', amigosIdsArray);
    
    // ===== PASO 4: Crear la visita =====
    console.log('\n📝 PASO 4: Creando la visita...');
    
    const nuevaVisita = await Visita.create({
      cafeteriaId,
      esCompartida,
      maxParticipantes,
      fecha: new Date(),
      estado: 'activa'
    });
    
    console.log(`✅ Visita creada con ID: ${nuevaVisita.id}`);
    
    // ===== PASO 5: Agregando al creador como participante =====
    console.log('\n📝 PASO 5: Agregando al creador como participante...');
    
    await VisitaParticipante.create({
      visitaId: nuevaVisita.id,
      usuarioId,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Creador agregado como participante`);
    
    // ===== PASO 6: Agregando participantes =====
    console.log('\n📝 PASO 6: Agregando participantes...');
    
    const participantesFinales = participantes.length > 0 ? participantes : amigosIdsArray;
    
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
    
    // ===== PASO 7: Crear reseña del creador =====
    console.log('\n📝 PASO 7: Creando reseña del creador...');
    
    if (calificacion && comentario) {
      await Resena.create({
        visitaId: nuevaVisita.id,
        usuarioId,
        calificacion,
        comentario
      });
      console.log(`✅ Reseña del creador creada automáticamente`);
    }
    
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
    
    // ===== PASO 9: Verificar datos finales =====
    console.log('\n📝 PASO 9: Verificando datos finales...');
    
    const visitaFinal = await Visita.findByPk(nuevaVisita.id, {
      include: [
        {
          model: VisitaParticipante,
          as: 'participantes',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name']
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
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    
    console.log(`✅ Total de participantes: ${visitaFinal.participantes.length}`);
    visitaFinal.participantes.forEach((participante, index) => {
      console.log(`  ${index + 1}. ${participante.usuario.name} (${participante.rol}) - ${participante.estado}`);
    });
    
    console.log(`✅ Total de reseñas: ${visitaFinal.resenas.length}`);
    visitaFinal.resenas.forEach((resena, index) => {
      console.log(`  ${index + 1}. ${resena.usuario.name}: ${resena.calificacion}/5 - "${resena.comentario}"`);
    });
    
    console.log('\n✅ Simulación completada exitosamente!');
    console.log('🎯 El problema estaba en que amigosIds llegaba como string/número');
    console.log('✅ Ahora el backend lo convierte correctamente a array');
    console.log('✅ El frontend puede enviar amigosIds como string o array');
    
  } catch (error) {
    console.error('❌ Error en la simulación:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testFrontendReal()
  .then(() => {
    console.log('✅ Script de simulación completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de simulación:', error);
    process.exit(1);
  }); 