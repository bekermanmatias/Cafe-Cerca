import { Resena, Visita, VisitaParticipante, User, Cafe } from '../models/index.js';

// Crear una reseña para una visita
export const crearResena = async (req, res) => {
  try {
    const { visitaId, calificacion, comentario } = req.body;
    const usuarioId = req.user.id;

    // Verificar que el usuario participó en la visita
    const participacion = await VisitaParticipante.findOne({
      where: {
        visitaId,
        usuarioId,
        estado: 'aceptada'
      }
    });

    if (!participacion) {
      return res.status(403).json({
        success: false,
        message: 'No puedes crear una reseña para una visita en la que no participaste'
      });
    }

    // Verificar que no existe ya una reseña del usuario para esta visita
    const resenaExistente = await Resena.findOne({
      where: {
        visitaId,
        usuarioId
      }
    });

    if (resenaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya has creado una reseña para esta visita'
      });
    }

    // Crear la reseña
    const resena = await Resena.create({
      visitaId,
      usuarioId,
      calificacion,
      comentario
    });

    res.status(201).json({
      success: true,
      message: 'Reseña creada exitosamente',
      data: resena
    });
  } catch (error) {
    console.error('Error al crear reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener reseñas de una visita específica
export const obtenerResenasVisita = async (req, res) => {
  try {
    const { visitaId } = req.params;

    const resenas = await Resena.findAll({
      where: { visitaId },
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: resenas
    });
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener reseñas de un usuario específico
export const obtenerResenasUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const resenas = await Resena.findAll({
      where: { usuarioId },
      include: [
        {
          model: Visita,
          as: 'visita',
          include: [
            {
              model: Cafe,
              as: 'cafeteria'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: resenas
    });
  } catch (error) {
    console.error('Error al obtener reseñas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar una reseña
export const actualizarResena = async (req, res) => {
  try {
    const { resenaId } = req.params;
    const { calificacion, mensaje } = req.body;
    const usuarioId = req.user.id;

    const resena = await Resena.findOne({
      where: {
        id: resenaId,
        usuarioId
      }
    });

    if (!resena) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada o no tienes permisos para editarla'
      });
    }

    await resena.update({
      calificacion,
      mensaje
    });

    res.status(200).json({
      success: true,
      message: 'Reseña actualizada exitosamente',
      data: resena
    });
  } catch (error) {
    console.error('Error al actualizar reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar una reseña
export const eliminarResena = async (req, res) => {
  try {
    const { resenaId } = req.params;
    const usuarioId = req.user.id;

    const resena = await Resena.findOne({
      where: {
        id: resenaId,
        usuarioId
      }
    });

    if (!resena) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada o no tienes permisos para eliminarla'
      });
    }

    await resena.destroy();

    res.status(200).json({
      success: true,
      message: 'Reseña eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}; 