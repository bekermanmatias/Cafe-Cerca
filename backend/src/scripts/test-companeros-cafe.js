import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';
import sequelize from '../config/database.js';

async function testCompanerosCafe() {
  try {
    console.log('🧪 Probando compañeros de café...');

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
        as: 'visita'
      }]
    });

    console.log(`📊 Total de participaciones: ${participaciones.length}`);

    // Obtener IDs de visitas donde participa el usuario
    const visitasIds = participaciones.map(p => p.visitaId);

    // Obtener compañeros de café (otros usuarios que participaron en las mismas visitas)
    const companerosCafe = await VisitaParticipante.findAll({
      where: {
        visitaId: {
          [sequelize.Sequelize.Op.in]: visitasIds
        },
        usuarioId: {
          [sequelize.Sequelize.Op.ne]: usuario.id // Excluir al usuario actual
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

    console.log(`👥 Compañeros de café encontrados: ${companerosCafe.length}`);

    if (companerosCafe.length > 0) {
      console.log('\n🏆 Top compañeros de café:');
      companerosCafe.forEach((companero, index) => {
        console.log(`  ${index + 1}. ${companero.usuario.name} - ${companero.getDataValue('cantidadVisitas')} visitas compartidas`);
      });
    } else {
      console.log('📝 No se encontraron compañeros de café');
    }

    // Mostrar algunas visitas compartidas como ejemplo
    console.log('\n📋 Ejemplos de visitas compartidas:');
    const visitasCompartidas = await VisitaParticipante.findAll({
      where: {
        visitaId: {
          [sequelize.Sequelize.Op.in]: visitasIds.slice(0, 3) // Solo las primeras 3 visitas
        },
        estado: 'aceptada'
      },
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['name']
        },
        {
          model: Visita,
          as: 'visita',
          include: [{
            model: Cafe,
            as: 'cafeteria',
            attributes: ['name']
          }]
        }
      ],
      order: [['visitaId', 'ASC']]
    });

    let currentVisitaId = null;
    visitasCompartidas.forEach(participacion => {
      if (participacion.visitaId !== currentVisitaId) {
        console.log(`\n  📍 ${participacion.visita.cafeteria.name}:`);
        currentVisitaId = participacion.visitaId;
      }
      console.log(`    - ${participacion.usuario.name} (${participacion.rol})`);
    });

    console.log('✅ Prueba completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
  }
}

testCompanerosCafe(); 