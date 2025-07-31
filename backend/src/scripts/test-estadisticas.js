import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';
import sequelize from '../config/database.js';

async function testEstadisticas() {
  try {
    console.log('🧪 Probando estadísticas...');

    // Obtener un usuario de prueba
    const usuario = await User.findOne({
      where: { email: 'ysy.a@example.com' }
    });

    if (!usuario) {
      console.log('❌ Usuario de prueba no encontrado');
      return;
    }

    console.log(`👤 Usuario: ${usuario.name} (ID: ${usuario.id})`);

    // Obtener todas las participaciones del usuario
    const participaciones = await VisitaParticipante.findAll({
      where: {
        usuarioId: usuario.id,
        estado: 'aceptada'
      },
      include: [{
        model: Visita,
        as: 'visita',
        include: [{
          model: Cafe,
          as: 'cafeteria',
          attributes: ['name', 'address', 'imageUrl', 'rating']
        }]
      }]
    });

    console.log(`📊 Total de participaciones: ${participaciones.length}`);

    // Contar tipos de visitas
    const visitasIndividuales = participaciones.filter(p => 
      p.rol === 'creador' && 
      !participaciones.some(other => 
        other.visitaId === p.visitaId && 
        other.usuarioId !== p.usuarioId && 
        other.estado === 'aceptada'
      )
    ).length;

    const visitasCompartidasCreador = participaciones.filter(p => 
      p.rol === 'creador' && 
      participaciones.some(other => 
        other.visitaId === p.visitaId && 
        other.usuarioId !== p.usuarioId && 
        other.estado === 'aceptada'
      )
    ).length;

    const visitasComoInvitado = participaciones.filter(p => 
      p.rol === 'participante'
    ).length;

    console.log('📈 Tipos de visitas:');
    console.log(`  - Individuales: ${visitasIndividuales}`);
    console.log(`  - Compartidas como creador: ${visitasCompartidasCreador}`);
    console.log(`  - Como invitado: ${visitasComoInvitado}`);
    console.log(`  - Total: ${visitasIndividuales + visitasCompartidasCreador + visitasComoInvitado}`);

    // Obtener cafeterías únicas
    const visitasUnicas = participaciones.map(p => p.visita);
    const cafeteriasUnicas = new Set(visitasUnicas.map(v => v.cafeteriaId)).size;
    console.log(`🏪 Cafeterías únicas visitadas: ${cafeteriasUnicas}`);

    // Obtener reseñas del usuario
    const visitasIds = visitasUnicas.map(v => v.id);
    const resenasUsuario = await Resena.findAll({
      where: {
        usuarioId: usuario.id,
        visitaId: {
          [sequelize.Sequelize.Op.in]: visitasIds
        }
      }
    });

    console.log(`⭐ Reseñas del usuario: ${resenasUsuario.length}`);

    if (resenasUsuario.length > 0) {
      const promedio = resenasUsuario.reduce((sum, r) => sum + r.calificacion, 0) / resenasUsuario.length;
      console.log(`📊 Promedio de calificaciones: ${promedio.toFixed(1)}`);
    }

    // Mostrar detalles de algunas participaciones
    console.log('\n📋 Detalles de participaciones:');
    participaciones.slice(0, 5).forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.visita.cafeteria.name} - Rol: ${p.rol} - Estado: ${p.estado}`);
    });

    console.log('✅ Prueba completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
  }
}

testEstadisticas(); 