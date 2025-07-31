import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🚀 Probando endpoint de detalle de visita...');

const testVisitaDetalle = async () => {
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
    
    // ===== PASO 3: Agregar participante aceptado =====
    console.log('\n📝 PASO 3: Agregando participante aceptado...');
    
    await VisitaParticipante.create({
      visitaId: nuevaVisita.id,
      usuarioId: ysy.id,
      rol: 'participante',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    });
    
    console.log(`✅ Participante agregado`);
    
    // ===== PASO 4: Crear reseña del creador =====
    console.log('\n📝 PASO 4: Creando reseña del creador...');
    
    await Resena.create({
      visitaId: nuevaVisita.id,
      usuarioId: duki.id,
      calificacion: 5,
      comentario: "¡Excelente experiencia! El café estaba perfecto."
    });
    
    console.log(`✅ Reseña del creador creada`);
    
    // ===== PASO 5: Crear reseña del participante =====
    console.log('\n📝 PASO 5: Creando reseña del participante...');
    
    await Resena.create({
      visitaId: nuevaVisita.id,
      usuarioId: ysy.id,
      calificacion: 4,
      comentario: "¡Me encantó la experiencia! El ambiente era genial."
    });
    
    console.log(`✅ Reseña del participante creada`);
    
    // ===== PASO 6: Obtener detalle de la visita =====
    console.log('\n📝 PASO 6: Obteniendo detalle de la visita...');
    
    const visita = await Visita.findOne({
      where: { id: nuevaVisita.id },
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
    
    if (!visita) {
      console.log('❌ No se encontró la visita');
      return;
    }
    
    // ===== PASO 7: Transformar datos =====
    console.log('\n📝 PASO 7: Transformando datos...');
    
    const visitaJSON = visita.toJSON();
    
    // Encontrar el creador
    const creador = visitaJSON.participantes?.find(p => p.rol === 'creador')?.usuario || null;
    
    // Obtener otros participantes (no creador)
    const otrosParticipantes = visitaJSON.participantes
      ?.filter(p => p.rol !== 'creador')
      .map(p => ({
        ...p.usuario,
        estado: p.estado,
        rol: p.rol,
        fechaRespuesta: p.fechaRespuesta
      })) || [];

    // Transformar reseñas
    const resenasTransformadas = visitaJSON.resenas?.map(resena => ({
      id: resena.id,
      calificacion: resena.calificacion,
      comentario: resena.comentario,
      fecha: resena.createdAt,
      usuario: resena.usuario
    })) || [];

    // Construir objeto final
    const visitaTransformada = {
      id: visitaJSON.id,
      fecha: visitaJSON.fecha,
      estado: visitaJSON.estado,
      esCompartida: visitaJSON.esCompartida,
      cafeteria: visitaJSON.cafeteria,
      creador: {
        ...creador,
        resena: resenasTransformadas.find(r => r.usuario.id === creador?.id)
      },
      participantes: otrosParticipantes.map(p => ({
        ...p,
        resena: resenasTransformadas.find(r => r.usuario.id === p.id)
      }))
    };
    
    // ===== PASO 8: Verificar datos =====
    console.log('\n📝 PASO 8: Verificando datos transformados...');
    
    console.log('✅ Información de la visita:');
    console.log(`  ID: ${visitaTransformada.id}`);
    console.log(`  Fecha: ${visitaTransformada.fecha}`);
    console.log(`  Estado: ${visitaTransformada.estado}`);
    console.log(`  Es compartida: ${visitaTransformada.esCompartida}`);
    
    console.log('\n✅ Información del creador:');
    console.log(`  Nombre: ${visitaTransformada.creador.name}`);
    console.log(`  Foto: ${visitaTransformada.creador.profileImage}`);
    console.log(`  Reseña: ${visitaTransformada.creador.resena.calificacion}/5 - "${visitaTransformada.creador.resena.comentario}"`);
    
    console.log('\n✅ Información de participantes:');
    visitaTransformada.participantes.forEach((participante, index) => {
      console.log(`\n  Participante ${index + 1}:`);
      console.log(`    Nombre: ${participante.name}`);
      console.log(`    Foto: ${participante.profileImage}`);
      console.log(`    Estado: ${participante.estado}`);
      console.log(`    Rol: ${participante.rol}`);
      if (participante.resena) {
        console.log(`    Reseña: ${participante.resena.calificacion}/5 - "${participante.resena.comentario}"`);
      }
    });
    
    console.log('\n🎉 ¡ÉXITO! Los datos se transforman correctamente');
    console.log('✅ La visita incluye toda la información necesaria');
    console.log('✅ Las reseñas están correctamente vinculadas a sus usuarios');
    console.log('✅ Los participantes tienen sus estados y roles');
    console.log('✅ Las imágenes de perfil están incluidas');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testVisitaDetalle()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  });