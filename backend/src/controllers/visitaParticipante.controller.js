import { VisitaParticipante, Visita, User, Cafe, Resena } from '../models/index.js';
import sequelize from '../config/database.js';

// Invitar usuarios a una visita
export const invitarUsuarios = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { visitaId } = req.params;
    const { usuarios } = req.body;
    const usuarioId = req.user.id;

    // Verificar que la visita existe y el usuario es el creador
    const visita = await Visita.findByPk(visitaId);
    if (!visita) {
      return res.status(404).json({
        success: false,
        message: 'Visita no encontrada'
      });
    }

    const participacionCreador = await VisitaParticipante.findOne({
      where: {
        visitaId,
        usuarioId,
        rol: 'creador'
      }
    });

    if (!participacionCreador) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador puede invitar usuarios'
      });
    }

    // Verificar que no se exceda el máximo de participantes
    const participantesActuales = await VisitaParticipante.count({
      where: { visitaId }
    });

    if (participantesActuales + usuarios.length > visita.maxParticipantes) {
      return res.status(400).json({
        success: false,
        message: `No se pueden agregar más participantes. Máximo: ${visita.maxParticipantes}`
      });
    }

    // Crear las invitaciones
    const invitaciones = usuarios.map(usuarioId => ({
      visitaId,
      usuarioId,
      rol: 'participante',
      estado: 'pendiente',
      fechaInvitacion: new Date()
    }));

    await VisitaParticipante.bulkCreate(invitaciones, { transaction: t });

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Invitaciones enviadas exitosamente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al invitar usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Responder a una invitación
export const responderInvitacion = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { visitaId } = req.params;
    const { respuesta } = req.body; // 'aceptada' o 'rechazada'
    const usuarioId = req.user.id;

    const participacion = await VisitaParticipante.findOne({
      where: {
        visitaId,
        usuarioId,
        estado: 'pendiente'
      }
    });

    if (!participacion) {
      return res.status(404).json({
        success: false,
        message: 'Invitación no encontrada'
      });
    }

    await participacion.update({
      estado: respuesta,
      fechaRespuesta: new Date()
    }, { transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: `Invitación ${respuesta} exitosamente`
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al responder invitación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Aceptar invitación con reseña
export const aceptarInvitacionConResena = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { visitaId } = req.params;
    const { comentario, calificacion } = req.body;
    const usuarioId = req.user.id;

    // Validar datos requeridos
    if (!comentario || !calificacion) {
      return res.status(400).json({
        success: false,
        message: 'Comentario y calificación son requeridos'
      });
    }

    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 5'
      });
    }

    // Verificar que la invitación existe y está pendiente
    const participacion = await VisitaParticipante.findOne({
      where: {
        visitaId,
        usuarioId,
        estado: 'pendiente'
      }
    });

    if (!participacion) {
      return res.status(404).json({
        success: false,
        message: 'Invitación no encontrada o ya respondida'
      });
    }

    // Verificar que no existe ya una reseña del usuario para esta visita
    const reseñaExistente = await Resena.findOne({
      where: {
        visitaId,
        usuarioId
      }
    });

    if (reseñaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya has dejado una reseña para esta visita'
      });
    }

    // Actualizar el estado de la participación a aceptada
    await participacion.update({
      estado: 'aceptada',
      fechaRespuesta: new Date()
    }, { transaction: t });

    // Crear la reseña
    await Resena.create({
      visitaId,
      usuarioId,
      comentario,
      calificacion
    }, { transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Invitación aceptada y reseña guardada exitosamente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al aceptar invitación con reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener invitaciones pendientes de un usuario
export const obtenerInvitacionesPendientes = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const invitaciones = await VisitaParticipante.findAll({
      where: {
        usuarioId,
        estado: 'pendiente'
      },
      include: [
        {
          model: Visita,
          as: 'visita',
          include: [
            {
              model: Cafe,
              as: 'cafeteria'
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
        }
      ],
      order: [['fechaInvitacion', 'DESC']]
    });

    // Transformar los datos para el frontend
    const invitacionesTransformadas = invitaciones.map(invitacion => {
      const visitaData = invitacion.visita;
      const creadorData = visitaData.participantes?.find(p => p.rol === 'creador')?.usuario;
      const reseñaCreador = visitaData.resenas?.find(r => r.usuarioId === creadorData?.id);
      
      return {
        id: invitacion.id,
        visita: {
          id: visitaData.id,
          comentario: reseñaCreador?.comentario || '',
          calificacion: reseñaCreador?.calificacion || 0,
          fecha: visitaData.fecha,
          cafeteria: {
            id: visitaData.cafeteria?.id,
            name: visitaData.cafeteria?.name,
            address: visitaData.cafeteria?.address,
            imageUrl: visitaData.cafeteria?.imageUrl
          },
          usuario: {
            id: creadorData?.id,
            name: creadorData?.name,
            profileImage: creadorData?.profileImage
          }
        },
        estado: invitacion.estado,
        rol: invitacion.rol
      };
    });

    res.status(200).json(invitacionesTransformadas);
  } catch (error) {
    console.error('Error al obtener invitaciones pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener participantes de una visita
export const obtenerParticipantes = async (req, res) => {
  try {
    const { visitaId } = req.params;

    const participantes = await VisitaParticipante.findAll({
      where: { visitaId },
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        }
      ],
      order: [['rol', 'ASC'], ['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: participantes
    });
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Remover participante de una visita
export const removerParticipante = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { visitaId, usuarioId } = req.params;
    const usuarioActual = req.user.id;

    // Verificar que el usuario actual es el creador
    const participacionCreador = await VisitaParticipante.findOne({
      where: {
        visitaId,
        usuarioId: usuarioActual,
        rol: 'creador'
      }
    });

    if (!participacionCreador) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador puede remover participantes'
      });
    }

    // No permitir remover al creador
    if (parseInt(usuarioId) === usuarioActual) {
      return res.status(400).json({
        success: false,
        message: 'No puedes removerte a ti mismo'
      });
    }

    const participacion = await VisitaParticipante.findOne({
      where: {
        visitaId,
        usuarioId
      }
    });

    if (!participacion) {
      return res.status(404).json({
        success: false,
        message: 'Participante no encontrado'
      });
    }

    await participacion.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Participante removido exitosamente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al remover participante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}; 