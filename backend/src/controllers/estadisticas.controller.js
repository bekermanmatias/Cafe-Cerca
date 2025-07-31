import { Sequelize } from 'sequelize';
import Visita from '../models/Visita.js';
import Cafe from '../models/Cafe.js';
import VisitaParticipante from '../models/VisitaParticipante.js';
import Resena from '../models/Resena.js';
import { User } from '../models/index.js';

export const getEstadisticasUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Verificar que el usuario solo pueda ver sus propias estadísticas
    if (parseInt(usuarioId) !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permiso para ver las estadísticas de otro usuario'
      });
    }

    // Obtener todas las visitas donde el usuario participa (como creador o participante aceptado)
    const participaciones = await VisitaParticipante.findAll({
      where: {
        usuarioId,
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

    // Si no tiene participaciones, devolver estadísticas vacías
    if (participaciones.length === 0) {
      return res.json({
        totalVisitas: 0,
        cafeteriasUnicas: 0,
        promedioCalificaciones: "0.0",
        distribucionCalificaciones: {},
        cafeteriasFavoritas: [],
        progresoMensual: [],
        visitasIndividuales: 0,
        visitasCompartidasCreador: 0,
        visitasComoInvitado: 0,
        companerosCafe: []
      });
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

    // Obtener top 4 cafeterías más visitadas
    const cafeteriasCount = {};
    visitasUnicas.forEach(visita => {
      const cafeId = visita.cafeteriaId;
      if (!cafeteriasCount[cafeId]) {
        cafeteriasCount[cafeId] = {
          cafeteria: visita.cafeteria,
          cantidadVisitas: 0
        };
      }
      cafeteriasCount[cafeId].cantidadVisitas++;
    });

    const cafeteriasFavoritas = Object.values(cafeteriasCount)
      .sort((a, b) => b.cantidadVisitas - a.cantidadVisitas)
      .slice(0, 4);

    // Obtener progreso mensual (últimos 4 meses)
    const progresoMensual = await VisitaParticipante.findAll({
      where: {
        usuarioId,
        estado: 'aceptada',
        fechaInvitacion: {
          [Sequelize.Op.gte]: Sequelize.literal('DATE_SUB(NOW(), INTERVAL 4 MONTH)')
        }
      },
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('fechaInvitacion'), '%Y-%m'), 'mes'],
        [Sequelize.fn('COUNT', '*'), 'cantidadVisitas']
      ],
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('fechaInvitacion'), '%Y-%m')],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('fechaInvitacion'), '%Y-%m'), 'DESC']],
      limit: 4
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
    
    for (let i = 3; i >= 0; i--) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const mesKey = `${año}-${mes}`;
      
      progresoFormateado.push({
        mes: mesesEnEspanol[mes],
        cantidadVisitas: mesesConDatos[mesKey] || 0
      });
    }

    // Calcular promedio de calificaciones dadas por el usuario
    const resenasUsuario = await Resena.findAll({
      where: {
        usuarioId,
        visitaId: {
          [Sequelize.Op.in]: visitasIds
        }
      },
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('calificacion')), 'promedio']
      ]
    });

    const promedioCalificaciones = resenasUsuario.length > 0 && resenasUsuario[0].getDataValue('promedio') 
      ? parseFloat(resenasUsuario[0].getDataValue('promedio')).toFixed(1) 
      : "0.0";

    // Obtener distribución de calificaciones
    const distribucionCalificaciones = await Resena.findAll({
      where: {
        usuarioId,
        visitaId: {
          [Sequelize.Op.in]: visitasIds
        }
      },
      attributes: [
        'calificacion',
        [Sequelize.fn('COUNT', Sequelize.col('calificacion')), 'cantidad']
      ],
      group: ['calificacion'],
      order: [['calificacion', 'DESC']]
    });

    const distribucionFormateada = distribucionCalificaciones.reduce((acc, item) => {
      acc[item.calificacion] = parseInt(item.getDataValue('cantidad'));
      return acc;
    }, {});

    // Obtener compañeros de café (amigos con más visitas compartidas)
    const companerosCafe = await VisitaParticipante.findAll({
      where: {
        visitaId: {
          [Sequelize.Op.in]: visitasIds
        },
        usuarioId: {
          [Sequelize.Op.ne]: usuarioId // Excluir al usuario actual
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
        [Sequelize.fn('COUNT', Sequelize.col('usuarioId')), 'cantidadVisitas']
      ],
      group: ['usuarioId', 'usuario.id'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('usuarioId')), 'DESC']],
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

    res.json({
      totalVisitas,
      cafeteriasUnicas,
      promedioCalificaciones,
      distribucionCalificaciones: distribucionFormateada,
      cafeteriasFavoritas,
      progresoMensual: progresoFormateado,
      visitasIndividuales,
      visitasCompartidasCreador,
      visitasComoInvitado,
      companerosCafe: companerosFormateados
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    
    // Si el error es por columna faltante, devolver respuesta vacía
    if (error.name === 'SequelizeDatabaseError' && 
        error.parent?.code === 'ER_BAD_FIELD_ERROR') {
      return res.json({
        totalVisitas: 0,
        cafeteriasUnicas: 0,
        promedioCalificaciones: "0.0",
        distribucionCalificaciones: {},
        cafeteriasFavoritas: [],
        progresoMensual: [],
        visitasIndividuales: 0,
        visitasCompartidasCreador: 0,
        visitasComoInvitado: 0,
        companerosCafe: []
      });
    }

    res.status(500).json({
      error: 'Error al obtener las estadísticas',
      details: error.message
    });
  }
}; 