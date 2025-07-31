import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe } from '../models/index.js';

console.log('🧪 Iniciando prueba de visita compartida...');

const testVisitaCompartida = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Obtener usuarios y una cafetería para la prueba
    const usuarios = await User.findAll({ limit: 3 });
    const cafe = await Cafe.findOne();
    
    if (usuarios.length < 2 || !cafe) {
      console.log('❌ No hay suficientes usuarios o cafeterías disponibles para la prueba');
      return;
    }
    
    const creador = usuarios[0];
    const participante = usuarios[1];
    
    console.log(`👤 Creador: ${creador.name}`);
    console.log(`👥 Participante: ${participante.name}`);
    console.log(`☕ Cafetería: ${cafe.name}`);
    
    // Crear una visita compartida
    const visita = await Visita.create({
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
      fecha: new Date(),
      estado: 'activa'
    });
    
    console.log(`✅ Visita compartida creada con ID: ${visita.id}`);
    
    // Agregar al creador como participante
    await VisitaParticipante.create({
      visitaId: visita.id,
      usuarioId: creador.id,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Creador agregado`);
    
    // Agregar al participante
    await VisitaParticipante.create({
      visitaId: visita.id,
      usuarioId: participante.id,
      rol: 'participante',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Participante agregado`);
    
    // Obtener la visita con todas las relaciones
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
        }
      ]
    });
    
    console.log('📋 Datos de la visita compartida:');
    console.log(JSON.stringify(visitaCompleta.toJSON(), null, 2));
    
    // Transformar para mostrar el usuario creador y participantes
    const visitaJSON = visitaCompleta.toJSON();
    const creadorData = visitaJSON.participantes?.find(p => p.rol === 'creador')?.usuario || null;
    const participantesData = visitaJSON.participantes?.filter(p => p.rol !== 'creador') || [];
    
    console.log('👤 Usuario creador:', creadorData);
    console.log('👥 Participantes:', participantesData.map(p => p.usuario.name));
    
    console.log('✅ Prueba de visita compartida completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testVisitaCompartida()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 