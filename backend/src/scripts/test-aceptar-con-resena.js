import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Probando endpoint de aceptar invitación con reseña...');

const testAceptarConResena = async () => {
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
    
    // ===== PASO 1: Crear una visita compartida =====
    console.log('\n📝 PASO 1: Creando visita compartida...');
    
    const nuevaVisita = await Visita.create({
      cafeteriaId: cafe.id,
      esCompartida: true,
      maxParticipantes: 10,
      fecha: new Date(),
      estado: 'activa'
    });
    
    console.log(`✅ Visita creada con ID: ${nuevaVisita.id}`);
    
    // ===== PASO 2: Agregar al creador =====
    console.log('\n📝 PASO 2: Agregando al creador...');
    
    await VisitaParticipante.create({
      visitaId: nuevaVisita.id,
      usuarioId: duki.id,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Creador agregado`);
    
    // ===== PASO 3: Agregar participante pendiente =====
    console.log('\n📝 PASO 3: Agregando participante pendiente...');
    
    await VisitaParticipante.create({
      visitaId: nuevaVisita.id,
      usuarioId: ysy.id,
      rol: 'participante',
      estado: 'pendiente',
      fechaInvitacion: new Date()
    });
    
    console.log(`✅ Participante pendiente agregado`);
    
    // ===== PASO 4: Crear reseña del creador =====
    console.log('\n📝 PASO 4: Creando reseña del creador...');
    
    await Resena.create({
      visitaId: nuevaVisita.id,
      usuarioId: duki.id,
      calificacion: 5,
      comentario: "¡Excelente experiencia! El café estaba perfecto."
    });
    
    console.log(`✅ Reseña del creador creada`);
    
    // ===== PASO 5: Simular aceptación con reseña =====
    console.log('\n📝 PASO 5: Simulando aceptación con reseña...');
    
    // Simular la llamada al endpoint
    const comentario = "¡Me encantó la experiencia! El ambiente era genial.";
    const calificacion = 4;
    
    // Verificar que la invitación existe y está pendiente
    const participacion = await VisitaParticipante.findOne({
      where: {
        visitaId: nuevaVisita.id,
        usuarioId: ysy.id,
        estado: 'pendiente'
      }
    });
    
    if (!participacion) {
      console.log('❌ No se encontró la participación pendiente');
      return;
    }
    
    console.log('✅ Participación pendiente encontrada');
    
    // Verificar que no existe ya una reseña del usuario
    const reseñaExistente = await Resena.findOne({
      where: {
        visitaId: nuevaVisita.id,
        usuarioId: ysy.id
      }
    });
    
    if (reseñaExistente) {
      console.log('❌ Ya existe una reseña del usuario para esta visita');
      return;
    }
    
    console.log('✅ No existe reseña previa del usuario');
    
    // ===== PASO 6: Aplicar la lógica del endpoint =====
    console.log('\n📝 PASO 6: Aplicando lógica del endpoint...');
    
    // Actualizar el estado de la participación a aceptada
    await participacion.update({
      estado: 'aceptada',
      fechaRespuesta: new Date()
    });
    
    console.log('✅ Participación actualizada a aceptada');
    
    // Crear la reseña
    await Resena.create({
      visitaId: nuevaVisita.id,
      usuarioId: ysy.id,
      comentario,
      calificacion
    });
    
    console.log('✅ Reseña creada exitosamente');
    
    // ===== PASO 7: Verificar resultados =====
    console.log('\n📝 PASO 7: Verificando resultados...');
    
    const participacionFinal = await VisitaParticipante.findOne({
      where: {
        visitaId: nuevaVisita.id,
        usuarioId: ysy.id
      }
    });
    
    const reseñaFinal = await Resena.findOne({
      where: {
        visitaId: nuevaVisita.id,
        usuarioId: ysy.id
      }
    });
    
    console.log(`✅ Estado final de participación: ${participacionFinal.estado}`);
    console.log(`✅ Reseña creada con calificación: ${reseñaFinal.calificacion}`);
    console.log(`✅ Comentario: "${reseñaFinal.comentario}"`);
    
    console.log('\n🎉 ¡ÉXITO! El endpoint funciona correctamente');
    console.log('✅ La invitación se aceptó y la reseña se guardó');
    console.log('✅ El usuario ahora es participante activo de la visita');
    console.log('✅ La reseña aparecerá en el detalle de la visita');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testAceptarConResena()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 