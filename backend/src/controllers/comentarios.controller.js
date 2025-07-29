import { Comentario, User } from '../models/index.js';

// Obtener comentarios de una visita
export const getComentariosByVisita = async (req, res) => {
  try {
    const { visitaId } = req.params;
    const comentarios = await Comentario.findAll({
      where: { visitaId },
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'name', 'profileImage']
      }],
      order: [['fechaHora', 'DESC']]
    });

    res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener los comentarios' });
  }
};

// Crear un nuevo comentario
export const createComentario = async (req, res) => {
  try {
    const { visitaId } = req.params;
    const { texto } = req.body;
    const userId = req.user.id; // ID del usuario autenticado

    const comentario = await Comentario.create({
      visitaId,
      userId,
      texto,
      fechaHora: new Date()
    });

    // Obtener el comentario con la información del usuario
    const comentarioConUsuario = await Comentario.findByPk(comentario.id, {
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'name', 'profileImage']
      }]
    });

    res.status(201).json(comentarioConUsuario);
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: 'Error al crear el comentario' });
  }
};

// Actualizar un comentario
export const updateComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto } = req.body;
    const userId = req.user.id;

    const comentario = await Comentario.findByPk(id);
    if (!comentario) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Verificar que el usuario sea el dueño del comentario
    if (comentario.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para editar este comentario' });
    }

    await comentario.update({ texto });

    // Obtener el comentario actualizado con la información del usuario
    const comentarioActualizado = await Comentario.findByPk(id, {
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'name', 'profileImage']
      }]
    });

    res.json(comentarioActualizado);
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    res.status(500).json({ error: 'Error al actualizar el comentario' });
  }
};

// Eliminar un comentario
export const deleteComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comentario = await Comentario.findByPk(id);
    if (!comentario) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Verificar que el usuario sea el dueño del comentario
    if (comentario.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
    }

    await comentario.destroy();
    res.json({ mensaje: 'Comentario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: 'Error al eliminar el comentario' });
  }
}; 