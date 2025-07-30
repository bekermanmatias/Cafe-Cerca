import { Comentario, Visita, User } from '../models/index.js';

// Obtener todos los comentarios de una visita
const getComentariosByVisita = async (req, res) => {
  try {
    const { visitaId } = req.params;

    // Verificar que la visita existe
    const visita = await Visita.findByPk(visitaId);
    if (!visita) {
      return res.status(200).json({
        message: 'No hay comentarios aún',
        comentarios: []
      });
    }

    const comentarios = await Comentario.findAll({
      where: { visitaId },
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'name', 'profileImage']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      message: comentarios.length > 0 ? 'Comentarios recuperados exitosamente' : 'No hay comentarios aún',
      comentarios: comentarios.map(comentario => ({
        ...comentario.toJSON(),
        usuario: comentario.usuario || null
      }))
    });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({
      message: 'Error al obtener los comentarios',
      error: error.message,
      comentarios: []
    });
  }
};

// Crear un nuevo comentario
const createComentario = async (req, res) => {
  try {
    const { visitaId } = req.params;
    const { contenido } = req.body;
    const userId = req.user.id;

    // Verificar que la visita existe
    const visita = await Visita.findByPk(visitaId);
    if (!visita) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    const comentario = await Comentario.create({
      visitaId,
      userId,
      contenido
    });

    // Obtener el comentario con la información del usuario
    const comentarioConUsuario = await Comentario.findByPk(comentario.id, {
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'name', 'profileImage']
      }]
    });

    res.status(201).json({
      message: 'Comentario creado exitosamente',
      comentario: comentarioConUsuario
    });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({
      message: 'Error al crear el comentario',
      error: error.message
    });
  }
};

// Actualizar un comentario
const updateComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;
    const userId = req.user.id;

    const comentario = await Comentario.findOne({
      where: { id, userId }
    });

    if (!comentario) {
      return res.status(404).json({ message: 'Comentario no encontrado o no tienes permiso para editarlo' });
    }

    await comentario.update({ contenido });

    // Obtener el comentario actualizado con la información del usuario
    const comentarioActualizado = await Comentario.findByPk(id, {
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'name', 'profileImage']
      }]
    });

    res.json({
      message: 'Comentario actualizado exitosamente',
      comentario: comentarioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    res.status(500).json({
      message: 'Error al actualizar el comentario',
      error: error.message
    });
  }
};

// Eliminar un comentario
const deleteComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const comentario = await Comentario.findOne({
      where: { id, userId }
    });

    if (!comentario) {
      return res.status(404).json({ message: 'Comentario no encontrado o no tienes permiso para eliminarlo' });
    }

    await comentario.destroy();
    res.json({ message: 'Comentario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({
      message: 'Error al eliminar el comentario',
      error: error.message
    });
  }
};

export {
  getComentariosByVisita,
  createComentario,
  updateComentario,
  deleteComentario
}; 