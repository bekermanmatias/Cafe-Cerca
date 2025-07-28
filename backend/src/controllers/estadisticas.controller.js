import { Sequelize } from 'sequelize';
import Visita from '../models/Visita.js';
import Cafe from '../models/Cafe.js';

export const getEstadisticasUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Obtener cantidad total de visitas
    const totalVisitas = await Visita.count({
      where: { usuarioId }
    });

    // Obtener cantidad de cafeterías únicas visitadas
    const cafeteriasUnicas = await Visita.count({
      where: { usuarioId },
      distinct: true,
      col: 'cafeteriaId'
    });

    // Obtener top 4 cafeterías más visitadas con su cantidad de visitas
    const cafeteriasFavoritas = await Visita.findAll({
      where: { usuarioId },
      attributes: [
        'cafeteriaId',
        [Sequelize.fn('COUNT', Sequelize.col('cafeteriaId')), 'visitCount']
      ],
      include: [{
        model: Cafe,
        as: 'cafeteria',
        attributes: ['name', 'address', 'imageUrl', 'rating']
      }],
      group: ['cafeteriaId', 'cafeteria.id'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('cafeteriaId')), 'DESC']],
      limit: 4
    });

    // Obtener progreso mensual (últimos 4 meses)
    const progresoMensual = await Visita.findAll({
      where: {
        usuarioId,
        fecha: {
          [Sequelize.Op.gte]: Sequelize.literal('DATE_SUB(NOW(), INTERVAL 4 MONTH)')
        }
      },
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('fecha'), '%Y-%m'), 'mes'],
        [Sequelize.fn('COUNT', '*'), 'cantidadVisitas']
      ],
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('fecha'), '%Y-%m')],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('fecha'), '%Y-%m'), 'DESC']],
      limit: 4
    });

    // Formatear el progreso mensual para que sea más amigable
    const mesesEnEspanol = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
    };

    const progresoFormateado = progresoMensual.map(registro => {
      const [año, mes] = registro.getDataValue('mes').split('-');
      return {
        mes: mesesEnEspanol[mes],
        cantidadVisitas: parseInt(registro.getDataValue('cantidadVisitas'))
      };
    });

    // Calcular promedio de calificaciones dadas
    const promedioCalificaciones = await Visita.findOne({
      where: { usuarioId },
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('calificacion')), 'promedio']
      ]
    });

    // Obtener distribución de calificaciones (cantidad de cada estrella)
    const distribucionCalificaciones = await Visita.findAll({
      where: { usuarioId },
      attributes: [
        'calificacion',
        [Sequelize.fn('COUNT', Sequelize.col('calificacion')), 'cantidad']
      ],
      group: ['calificacion'],
      order: [['calificacion', 'DESC']]
    });

    res.json({
      totalVisitas,
      cafeteriasUnicas,
      promedioCalificaciones: parseFloat(promedioCalificaciones.getDataValue('promedio')).toFixed(1),
      distribucionCalificaciones: distribucionCalificaciones.reduce((acc, item) => {
        acc[item.calificacion] = parseInt(item.getDataValue('cantidad'));
        return acc;
      }, {}),
      cafeteriasFavoritas: cafeteriasFavoritas.map(visita => ({
        cafeteria: visita.cafeteria,
        cantidadVisitas: parseInt(visita.getDataValue('visitCount'))
      })),
      progresoMensual: progresoFormateado
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener las estadísticas',
      details: error.message
    });
  }
}; 