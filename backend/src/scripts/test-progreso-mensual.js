import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';
import sequelize from '../config/database.js';

async function testProgresoMensual() {
  try {
    console.log('🧪 Probando progreso mensual...');

    // Obtener un usuario de prueba
    const usuario = await User.findOne({
      where: { email: 'ysy.a@example.com' }
    });

    if (!usuario) {
      console.log('❌ Usuario de prueba no encontrado');
      return;
    }

    console.log(`👤 Usuario: ${usuario.name} (ID: ${usuario.id})`);

    // Simular la lógica del progreso mensual
    const progresoMensual = await VisitaParticipante.findAll({
      where: {
        usuarioId: usuario.id,
        estado: 'aceptada',
        fechaInvitacion: {
          [sequelize.Sequelize.Op.gte]: sequelize.Sequelize.literal('DATE_SUB(NOW(), INTERVAL 4 MONTH)')
        }
      },
      attributes: [
        [sequelize.Sequelize.fn('DATE_FORMAT', sequelize.Sequelize.col('fechaInvitacion'), '%Y-%m'), 'mes'],
        [sequelize.Sequelize.fn('COUNT', '*'), 'cantidadVisitas']
      ],
      group: [sequelize.Sequelize.fn('DATE_FORMAT', sequelize.Sequelize.col('fechaInvitacion'), '%Y-%m')],
      order: [[sequelize.Sequelize.fn('DATE_FORMAT', sequelize.Sequelize.col('fechaInvitacion'), '%Y-%m'), 'DESC']],
      limit: 4
    });

    console.log(`📊 Meses con datos encontrados: ${progresoMensual.length}`);

    // Mostrar los datos originales
    console.log('\n📋 Datos originales de la base de datos:');
    progresoMensual.forEach(registro => {
      console.log(`  - ${registro.getDataValue('mes')}: ${registro.getDataValue('cantidadVisitas')} visitas`);
    });

    // Formatear el progreso mensual y generar los últimos 4 meses completos
    const mesesEnEspanol = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
    };

    // Crear un mapa de los meses con datos
    const mesesConDatos = {};
    progresoMensual.forEach(registro => {
      const [año, mes] = registro.getDataValue('mes').split('-');
      const mesKey = `${año}-${mes}`;
      mesesConDatos[mesKey] = parseInt(registro.getDataValue('cantidadVisitas'));
    });

    // Generar los últimos 4 meses (incluyendo los vacíos)
    const progresoFormateado = [];
    const fechaActual = new Date();
    
    console.log('\n📅 Generando los últimos 4 meses:');
    for (let i = 3; i >= 0; i--) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const mesKey = `${año}-${mes}`;
      
      const cantidadVisitas = mesesConDatos[mesKey] || 0;
      const mesNombre = mesesEnEspanol[mes];
      
      progresoFormateado.push({
        mes: mesNombre,
        cantidadVisitas: cantidadVisitas
      });

      console.log(`  - ${mesNombre} (${mesKey}): ${cantidadVisitas} visitas`);
    }

    console.log('\n✅ Progreso mensual completado con 4 meses');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
  }
}

testProgresoMensual(); 