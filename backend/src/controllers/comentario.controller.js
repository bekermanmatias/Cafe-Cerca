import { Comentario, Visita } from '../models/index.js';

// Obtener todos los comentarios de una visita
const getComentariosByVisita = async (req, res) => {
  try {
    const { visitaId } = req.params;
    const comentarios = await Comentario.findAll({
      where: { visitaId },
      order: [['fechaHora', 'DESC']]
    });
    res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ message: 'Error al obtener los comentarios' });
  }
};

// Crear un nuevo comentario
const createComentario = async (req, res) => {
  try {
    const { visitaId } = req.params;
    const { nombreUsuario, texto } = req.body;

    // Verificar que la visita existe
    const visita = await Visita.findByPk(visitaId);
    if (!visita) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    const comentario = await Comentario.create({
      visitaId,
      userId: 1, // Por ahora usamos usuario fijo
      nombreUsuario,
      texto,
      fechaHora: new Date()
    });

    res.status(201).json(comentario);
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ message: 'Error al crear el comentario' });
  }
};

// Actualizar un comentario
const updateComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto } = req.body;

    const comentario = await Comentario.findByPk(id);
    if (!comentario) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    await comentario.update({ texto });
    res.json(comentario);
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    res.status(500).json({ message: 'Error al actualizar el comentario' });
  }
};

// Eliminar un comentario
const deleteComentario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comentario = await Comentario.findByPk(id);
    if (!comentario) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    await comentario.destroy();
    res.json({ message: 'Comentario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ message: 'Error al eliminar el comentario' });
  }
};

export {
  getComentariosByVisita,
  createComentario,
  updateComentario,
  deleteComentario
}; 