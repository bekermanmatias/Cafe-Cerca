import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe } from '../models/index.js';

console.log('🧪 Iniciando prueba de visita...');

const testVisita = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Obtener un usuario y una cafetería para la prueba
    const usuario = await User.findOne();
    const cafe = await Cafe.findOne();
    
    if (!usuario || !cafe) {
      console.log('❌ No hay usuarios o cafeterías disponibles para la prueba');
      return;
    }
    
    console.log(`👤 Usuario de prueba: ${usuario.name}`);
    console.log(`☕ Cafetería de prueba: ${cafe.name}`);
    
    // Crear una visita de prueba
    const visita = await Visita.create({
      cafeteriaId: cafe.id,
      esCompartida: false,
      maxParticipantes: 10,
      fecha: new Date(),
      estado: 'activa'
    });
    
    console.log(`✅ Visita creada con ID: ${visita.id}`);
    
    // Agregar al usuario como participante (creador)
    await VisitaParticipante.create({
      visitaId: visita.id,
      usuarioId: usuario.id,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Usuario agregado como creador`);
    
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
    
    console.log('📋 Datos de la visita:');
    console.log(JSON.stringify(visitaCompleta.toJSON(), null, 2));
    
    // Transformar para mostrar el usuario creador
    const visitaJSON = visitaCompleta.toJSON();
    const creador = visitaJSON.participantes?.find(p => p.rol === 'creador')?.usuario || null;
    
    console.log('👤 Usuario creador:', creador);
    
    console.log('✅ Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testVisita()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 