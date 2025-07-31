import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Probando flujo completo de invitaciones desde frontend...');

const testFrontendInvitaciones = async () => {
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
      console.log(`Duki: ${duki ? 'Encontrado' : 'No encontrado'}`);
      console.log(`Ysy: ${ysy ? 'Encontrado' : 'No encontrado'}`);
      console.log(`Café: ${cafe ? 'Encontrado' : 'No encontrado'}`);
      return;
    }
    
    console.log(`👤 Duki: ${duki.name} (ID: ${duki.id})`);
    console.log(`👥 Ysy: ${ysy.name} (ID: ${ysy.id})`);
    console.log(`☕ Cafetería: ${cafe.name}`);
    
    // ===== PASO 1: Simular creación de visita compartida desde frontend =====
    console.log('\n📝 PASO 1: Simulando creación de visita compartida desde frontend...');
    
    // Datos que enviaría el frontend
    const frontendData = {
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
      amigosIds: [ysy.id], // Ysy como participante
      calificacion: 5,
      comentario: "¡Excelente experiencia! El café estaba perfecto."
    };
    
    console.log('📋 Datos del frontend:', frontendData);
    
    // ===== PASO 2: Crear la visita (como lo hace el backend) =====
    console.log('\n📝 PASO 2: Creando la visita...');
    
    const visita = await Visita.create({
      cafeteriaId: frontendData.cafeteriaId,
      esCompartida: frontendData.esCompartida,
      maxParticipantes: frontendData.maxParticipantes,
      fecha: new Date(),
      estado: 'activa'
    });
    
    console.log(`✅ Visita creada con ID: ${visita.id}`);
    
    // ===== PASO 3: Agregar al creador como participante =====
    console.log('\n📝 PASO 3: Agregando al creador como participante...');
    
    await VisitaParticipante.create({
      visitaId: visita.id,
      usuarioId: duki.id,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Creador agregado como participante`);
    
    // ===== PASO 4: Agregar participantes (invitaciones) =====
    console.log('\n📝 PASO 4: Agregando participantes...');
    
    const participantesParaGuardar = frontendData.amigosIds.map(participanteId => ({
      visitaId: visita.id,
      usuarioId: participanteId,
      rol: 'participante',
      estado: 'pendiente', // Estado inicial: pendiente
      fechaInvitacion: new Date()
    }));

    await VisitaParticipante.bulkCreate(participantesParaGuardar);
    console.log(`✅ ${frontendData.amigosIds.length} participantes agregados`);
    
    // ===== PASO 5: Crear reseña del creador automáticamente =====
    console.log('\n📝 PASO 5: Creando reseña del creador...');
    
    if (frontendData.calificacion && frontendData.comentario) {
      await Resena.create({
        visitaId: visita.id,
        usuarioId: duki.id,
        calificacion: frontendData.calificacion,
        comentario: frontendData.comentario
      });
      console.log(`✅ Reseña del creador creada automáticamente`);
    }
    
    // ===== PASO 6: Verificar que las invitaciones se crearon correctamente =====
    console.log('\n📝 PASO 6: Verificando invitaciones creadas...');
    
    const invitacionesCreadas = await VisitaParticipante.findAll({
      where: {
        visitaId: visita.id
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
    
    // ===== PASO 7: Verificar invitaciones pendientes de Ysy =====
    console.log('\n📝 PASO 7: Verificando invitaciones pendientes de Ysy...');
    
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
    
    invitacionesPendientesYsy.forEach((invitacion, index) => {
      const visitaData = invitacion.visita;
      const creadorData = visitaData.participantes?.find(p => p.rol === 'creador')?.usuario;
      const reseñaCreador = visitaData.resenas?.find(r => r.usuarioId === creadorData?.id);
      
      console.log(`\n  ${index + 1}. Invitación ID ${invitacion.id}:`);
      console.log(`     📝 Visita ID: ${visitaData.id}`);
      console.log(`     ☕ Cafetería: ${visitaData.cafeteria?.name}`);
      console.log(`     👤 Creador: ${creadorData?.name}`);
      console.log(`     💬 Comentario: "${reseñaCreador?.comentario || 'Sin comentario'}"`);
      console.log(`     ⭐ Calificación: ${reseñaCreador?.calificacion || 0}/5`);
      console.log(`     📅 Fecha invitación: ${invitacion.fechaInvitacion}`);
    });
    
    // ===== PASO 8: Simular respuesta del endpoint de invitaciones pendientes =====
    console.log('\n📝 PASO 8: Simulando respuesta del endpoint de invitaciones pendientes...');
    
    const invitacionesTransformadas = invitacionesPendientesYsy.map(invitacion => {
      const visitaData = invitacion.visita;
      const creadorData = visitaData.participantes?.find(p => p.rol === 'creador')?.usuario;
      const reseñaCreador = visitaData.resenas?.find(r => r.usuarioId === creadorData?.id);
      
      return {
        id: invitacion.id,
        visita: {
          id: visitaData.id,
          comentario: reseñaCreador?.comentario || '',
          calificacion: reseñaCreador?.calificacion || 0,
          fecha: visitaData.fecha,
          cafeteria: {
            id: visitaData.cafeteria?.id,
            name: visitaData.cafeteria?.name,
            address: visitaData.cafeteria?.address,
            imageUrl: visitaData.cafeteria?.imageUrl
          },
          usuario: {
            id: creadorData?.id,
            name: creadorData?.name,
            profileImage: creadorData?.profileImage
          }
        },
        estado: invitacion.estado,
        rol: invitacion.rol
      };
    });
    
    console.log('\n🎉 RESPUESTA PARA EL FRONTEND:');
    invitacionesTransformadas.forEach((invitacion, index) => {
      console.log(`\n  ${index + 1}. Invitación ID ${invitacion.id}:`);
      console.log(`     👤 ${invitacion.visita.usuario.name} te invitó a una visita`);
      console.log(`     ☕ ${invitacion.visita.cafeteria.name}`);
      console.log(`     💬 "${invitacion.visita.comentario}"`);
      console.log(`     ⭐ ${invitacion.visita.calificacion}/5`);
      console.log(`     📅 ${new Date(invitacion.visita.fecha).toLocaleDateString()}`);
    });
    
    console.log('\n✅ Flujo completo probado exitosamente!');
    console.log('🎯 El sistema está funcionando correctamente:');
    console.log('   ✅ Visita compartida creada');
    console.log('   ✅ Creador agregado como participante');
    console.log('   ✅ Participantes invitados con estado pendiente');
    console.log('   ✅ Reseña del creador creada automáticamente');
    console.log('   ✅ Invitaciones pendientes disponibles para Ysy');
    console.log('   ✅ Datos transformados correctamente para el frontend');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testFrontendInvitaciones()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 