import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🧪 Probando visita compartida con datos del frontend...');

const testVisitaCompartidaFrontend = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Obtener un usuario y una cafetería para la prueba
    const usuario = await User.findOne();
    const cafe = await Cafe.findOne();
    const amigo = await User.findOne({ where: { id: { [sequelize.Sequelize.Op.ne]: usuario.id } } });
    
    if (!usuario || !cafe || !amigo) {
      console.log('❌ No hay suficientes datos para la prueba');
      return;
    }
    
    console.log(`👤 Usuario creador: ${usuario.name}`);
    console.log(`👥 Amigo invitado: ${amigo.name}`);
    console.log(`☕ Cafetería: ${cafe.name}`);
    
    // Simular los datos que envía el frontend
    const datosFrontend = {
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
      amigosIds: [amigo.id], // El frontend usa amigosIds
      calificacion: 5, // El frontend envía calificación
      comentario: "¡Excelente experiencia compartida!" // El frontend envía comentario
    };
    
    console.log('📝 Datos que envía el frontend:', datosFrontend);
    
    // Crear la visita usando la misma lógica del controlador
    const visita = await Visita.create({
      cafeteriaId: datosFrontend.cafeteriaId,
      esCompartida: datosFrontend.esCompartida,
      maxParticipantes: datosFrontend.maxParticipantes,
      fecha: new Date(),
      estado: 'activa'
    });
    
    console.log(`✅ Visita creada con ID: ${visita.id}`);
    
    // Agregar al creador como participante
    await VisitaParticipante.create({
      visitaId: visita.id,
      usuarioId: usuario.id,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Creador agregado como participante`);
    
    // Agregar participantes usando amigosIds
    const participantesFinales = datosFrontend.amigosIds;
    if (datosFrontend.esCompartida && participantesFinales.length > 0) {
      const participantesParaGuardar = participantesFinales.map(participanteId => ({
        visitaId: visita.id,
        usuarioId: participanteId,
        rol: 'participante',
        estado: 'pendiente',
        fechaInvitacion: new Date()
      }));

      await VisitaParticipante.bulkCreate(participantesParaGuardar);
      console.log(`✅ ${participantesFinales.length} participantes agregados`);
    }
    
    // Crear reseña automáticamente si se proporcionan calificación y comentario
    if (datosFrontend.calificacion && datosFrontend.comentario) {
      await Resena.create({
        visitaId: visita.id,
        usuarioId: usuario.id,
        calificacion: datosFrontend.calificacion,
        comentario: datosFrontend.comentario
      });
      console.log(`✅ Reseña automática creada`);
    }
    
    // Obtener la visita completa con todas las relaciones
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
    
    console.log('\n📋 Resultado final:');
    const visitaJSON = visitaCompleta.toJSON();
    const creador = visitaJSON.participantes?.find(p => p.rol === 'creador')?.usuario || null;
    const participantes = visitaJSON.participantes?.filter(p => p.rol !== 'creador') || [];
    const resenas = visitaJSON.resenas || [];
    
    console.log(`  📝 Visita ID ${visita.id}:`);
    console.log(`    ☕ Cafetería: ${visitaJSON.cafeteria?.name}`);
    console.log(`    👤 Creador: ${creador?.name}`);
    console.log(`    👥 Participantes: ${participantes.length} (${participantes.map(p => p.usuario.name).join(', ')})`);
    console.log(`    📝 Reseñas: ${resenas.length} (${resenas.map(r => `${r.usuario.name}: ${r.calificacion}⭐`).join(', ')})`);
    console.log(`    🔗 Compartida: ${visitaJSON.esCompartida ? 'Sí' : 'No'}`);
    
    console.log('\n✅ Prueba de visita compartida con datos del frontend completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testVisitaCompartidaFrontend()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 