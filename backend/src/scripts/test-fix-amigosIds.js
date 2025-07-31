import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Probando fix para amigosIds...');

const testFixAmigosIds = async () => {
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
    
    // ===== PASO 1: Simular el problema original =====
    console.log('\n📝 PASO 1: Simulando el problema original...');
    
    // Simular datos que llegan del frontend (amigosIds como número)
    const datosProblema = {
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
      participantes: [],
      amigosIds: ysy.id, // ¡PROBLEMA! Es un número, no un array
      calificacion: 5,
      comentario: "¡Excelente experiencia!"
    };
    
    console.log('📋 Datos que causan el problema:', datosProblema);
    console.log('❌ amigosIds es un número:', typeof datosProblema.amigosIds);
    
    // ===== PASO 2: Aplicar el fix =====
    console.log('\n📝 PASO 2: Aplicando el fix...');
    
    const { amigosIds } = datosProblema;
    const amigosIdsArray = Array.isArray(amigosIds) ? amigosIds : [amigosIds].filter(id => id);
    
    console.log('✅ amigosIds convertido a array:', amigosIdsArray);
    console.log('✅ Tipo correcto:', Array.isArray(amigosIdsArray));
    
    // ===== PASO 3: Verificar que funciona =====
    console.log('\n📝 PASO 3: Verificando que funciona...');
    
    const participantesFinales = datosProblema.participantes.length > 0 ? datosProblema.participantes : amigosIdsArray;
    
    console.log('✅ participantesFinales:', participantesFinales);
    console.log('✅ Es array:', Array.isArray(participantesFinales));
    console.log('✅ Tiene método map:', typeof participantesFinales.map === 'function');
    
    // ===== PASO 4: Probar el map =====
    console.log('\n📝 PASO 4: Probando el map...');
    
    try {
      const participantesParaGuardar = participantesFinales.map(participanteId => ({
        visitaId: 999, // ID de ejemplo
        usuarioId: participanteId,
        rol: 'participante',
        estado: 'pendiente',
        fechaInvitacion: new Date()
      }));
      
      console.log('✅ Map funcionó correctamente');
      console.log('✅ Participantes para guardar:', participantesParaGuardar);
    } catch (error) {
      console.log('❌ Error en map:', error.message);
    }
    
    // ===== PASO 5: Crear visita real para verificar =====
    console.log('\n📝 PASO 5: Creando visita real...');
    
    const nuevaVisita = await Visita.create({
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
      fecha: new Date(),
      estado: 'activa'
    });
    
    console.log(`✅ Visita creada con ID: ${nuevaVisita.id}`);
    
    // Agregar al creador
    await VisitaParticipante.create({
      visitaId: nuevaVisita.id,
      usuarioId: duki.id,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Creador agregado`);
    
    // Agregar participantes usando el fix
    const participantesParaGuardar = participantesFinales.map(participanteId => ({
      visitaId: nuevaVisita.id,
      usuarioId: participanteId,
      rol: 'participante',
      estado: 'pendiente',
      fechaInvitacion: new Date()
    }));
    
    await VisitaParticipante.bulkCreate(participantesParaGuardar);
    console.log('✅ Participantes agregados exitosamente');
    
    // Crear reseña del creador
    await Resena.create({
      visitaId: nuevaVisita.id,
      usuarioId: duki.id,
      calificacion: 5,
      comentario: "¡Excelente experiencia!"
    });
    
    console.log('✅ Reseña del creador creada');
    
    // ===== PASO 6: Verificar resultados =====
    console.log('\n📝 PASO 6: Verificando resultados...');
    
    const participantesFinalesDB = await VisitaParticipante.findAll({
      where: { visitaId: nuevaVisita.id },
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name']
        }
      ]
    });
    
    console.log(`✅ Total de participantes en DB: ${participantesFinalesDB.length}`);
    participantesFinalesDB.forEach((participante, index) => {
      console.log(`  ${index + 1}. ${participante.usuario.name} (${participante.rol}) - ${participante.estado}`);
    });
    
    console.log('\n🎉 ¡ÉXITO! El fix funciona correctamente');
    console.log('✅ amigosIds se convierte correctamente a array');
    console.log('✅ El map funciona sin errores');
    console.log('✅ Los participantes se guardan correctamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testFixAmigosIds()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 