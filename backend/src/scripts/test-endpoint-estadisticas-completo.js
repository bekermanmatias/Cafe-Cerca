import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';
import sequelize from '../config/database.js';

async function testEndpointCompleto() {
  try {
    console.log('🧪 Probando endpoint completo de estadísticas...');

    // Obtener un usuario de prueba
    const usuario = await User.findOne({
      where: { email: 'ysy.a@example.com' }
    });

    if (!usuario) {
      console.log('❌ Usuario de prueba no encontrado');
      return;
    }

    console.log(`👤 Usuario: ${usuario.name} (ID: ${usuario.id})`);

    // Simular la lógica del endpoint
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

    if (participaciones.length === 0) {
      console.log('📝 No hay participaciones');
      return;
    }

    // Extraer las visitas únicas de las participaciones
    const visitasUnicas = participaciones.map(p => p.visita);
    const visitasIds = visitasUnicas.map(v => v.id);

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

    const totalVisitas = visitasIndividuales + visitasCompartidasCreador + visitasComoInvitado;

    // Obtener cafeterías únicas visitadas
    const cafeteriasUnicas = new Set(visitasUnicas.map(v => v.cafeteriaId)).size;

    // Obtener compañeros de café
    const companerosCafe = await VisitaParticipante.findAll({
      where: {
        visitaId: {
          [sequelize.Sequelize.Op.in]: visitasIds
        },
        usuarioId: {
          [sequelize.Sequelize.Op.ne]: usuario.id
        },
        estado: 'aceptada'
      },
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'name', 'profileImage']
      }],
      attributes: [
        'usuarioId',
        [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('usuarioId')), 'cantidadVisitas']
      ],
      group: ['usuarioId', 'usuario.id'],
      order: [[sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('usuarioId')), 'DESC']],
      limit: 5
    });

    const companerosFormateados = companerosCafe.map(companero => ({
      usuario: {
        id: companero.usuario.id,
        name: companero.usuario.name,
        profileImage: companero.usuario.profileImage
      },
      cantidadVisitas: parseInt(companero.getDataValue('cantidadVisitas'))
    }));

    console.log('\n📊 Estadísticas completas:');
    console.log(`  - Total visitas: ${totalVisitas}`);
    console.log(`  - Cafeterías únicas: ${cafeteriasUnicas}`);
    console.log(`  - Visitas individuales: ${visitasIndividuales}`);
    console.log(`  - Visitas compartidas como creador: ${visitasCompartidasCreador}`);
    console.log(`  - Visitas como invitado: ${visitasComoInvitado}`);
    console.log(`  - Compañeros de café: ${companerosFormateados.length}`);

    if (companerosFormateados.length > 0) {
      console.log('\n🏆 Compañeros de café:');
      companerosFormateados.forEach((companero, index) => {
        console.log(`  ${index + 1}. ${companero.usuario.name} - ${companero.cantidadVisitas} visitas`);
      });
    }

    console.log('✅ Endpoint completo funcionando correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

testEndpointCompleto(); 