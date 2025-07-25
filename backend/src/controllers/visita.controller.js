import Visita from '../models/Visita.js';
import VisitaImagen from '../models/VisitaImagen.js';
import sequelize from '../config/database.js';

// Función helper para incluir las imágenes en las consultas
const includeImagenes = {
  model: VisitaImagen,
  as: 'imagenes',
  attributes: ['imageUrl', 'orden']
};

// Función helper para ordenar las imágenes
const orderOptions = [
  ['fecha', 'DESC'],
  [{ model: VisitaImagen, as: 'imagenes' }, 'orden', 'ASC']
];

export const crearVisita = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { usuarioId, cafeteriaId, comentario, calificacion } = req.body;
    const imagenes = req.files; // Múltiples archivos

    // Validar número máximo de imágenes
    if (imagenes && imagenes.length > 5) {
      return res.status(400).json({
        mensaje: 'No se pueden subir más de 5 imágenes por visita'
      });
    }

    // Crear la visita
    const nuevaVisita = await Visita.create({
      usuarioId,
      cafeteriaId,
      comentario,
      calificacion
    }, { transaction: t });

    // Si hay imágenes, guardarlas
    if (imagenes && imagenes.length > 0) {
      const imagenesParaGuardar = imagenes.map((imagen, index) => ({
        visitaId: nuevaVisita.id,
        imageUrl: imagen.path,
        orden: index + 1
      }));

      await VisitaImagen.bulkCreate(imagenesParaGuardar, { transaction: t });
    }

    await t.commit();

    // Obtener la visita con sus imágenes
    const visitaConImagenes = await Visita.findByPk(nuevaVisita.id, {
      include: [includeImagenes],
      order: orderOptions
    });

    res.status(201).json({
      mensaje: 'Visita creada exitosamente',
      visita: visitaConImagenes
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al crear visita:', error);
    res.status(500).json({
      mensaje: 'Error al crear la visita',
      error: error.message
    });
  }
};

export const obtenerVisitas = async (req, res) => {
  try {
    const visitas = await Visita.findAll({
      include: [includeImagenes],
      order: orderOptions
    });

    res.json({
      mensaje: 'Visitas recuperadas exitosamente',
      totalVisitas: visitas.length,
      visitas
    });
  } catch (error) {
    console.error('Error al obtener visitas:', error);
    res.status(500).json({
      mensaje: 'Error al obtener las visitas',
      error: error.message
    });
  }
};

export const obtenerVisitaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const visita = await Visita.findByPk(id, {
      include: [includeImagenes],
      order: orderOptions
    });
    
    if (!visita) {
      return res.status(404).json({ mensaje: 'Visita no encontrada' });
    }
    
    res.json({
      mensaje: 'Visita recuperada exitosamente',
      visita
    });
  } catch (error) {
    console.error('Error al obtener la visita:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener la visita',
      error: error.message 
    });
  }
};

export const actualizarVisita = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { usuarioId, cafeteriaId, comentario, calificacion } = req.body;
    const imagenes = req.files;

    // Verificar si la visita existe
    const visita = await Visita.findByPk(id, {
      include: [includeImagenes]
    });

    if (!visita) {
      return res.status(404).json({ mensaje: 'Visita no encontrada' });
    }

    // Actualizar datos básicos de la visita
    await visita.update({
      usuarioId,
      cafeteriaId,
      comentario,
      calificacion
    }, { transaction: t });

    // Si hay nuevas imágenes
    if (imagenes && imagenes.length > 0) {
      if (imagenes.length > 5) {
        return res.status(400).json({
          mensaje: 'No se pueden subir más de 5 imágenes por visita'
        });
      }

      // Eliminar imágenes anteriores
      await VisitaImagen.destroy({
        where: { visitaId: id },
        transaction: t
      });

      // Guardar nuevas imágenes
      const imagenesParaGuardar = imagenes.map((imagen, index) => ({
        visitaId: id,
        imageUrl: imagen.path,
        orden: index + 1
      }));

      await VisitaImagen.bulkCreate(imagenesParaGuardar, { transaction: t });
    }

    await t.commit();

    // Obtener la visita actualizada con sus imágenes
    const visitaActualizada = await Visita.findByPk(id, {
      include: [includeImagenes],
      order: orderOptions
    });

    res.json({
      mensaje: 'Visita actualizada exitosamente',
      visita: visitaActualizada
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar visita:', error);
    res.status(500).json({
      mensaje: 'Error al actualizar la visita',
      error: error.message
    });
  }
};

export const eliminarVisita = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Verificar si la visita existe y obtener sus imágenes
    const visita = await Visita.findByPk(id, {
      include: [includeImagenes]
    });

    if (!visita) {
      return res.status(404).json({ mensaje: 'Visita no encontrada' });
    }

    // Guardar información de la visita antes de eliminarla
    const visitaEliminada = { ...visita.toJSON() };

    // Eliminar primero las imágenes asociadas
    await VisitaImagen.destroy({
      where: { visitaId: id },
      transaction: t
    });

    // Eliminar la visita
    await visita.destroy({ transaction: t });

    await t.commit();

    res.json({
      mensaje: 'Visita eliminada exitosamente',
      visita: visitaEliminada
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar visita:', error);
    res.status(500).json({
      mensaje: 'Error al eliminar la visita',
      error: error.message
    });
  }
};

export const obtenerDiarioUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const visitas = await Visita.findAll({
      where: { usuarioId },
      include: [includeImagenes],
      order: orderOptions
    });

    res.json({
      mensaje: visitas.length > 0 ? 'Diario recuperado exitosamente' : 'El usuario no tiene visitas registradas',
      totalVisitas: visitas.length,
      visitas
    });

  } catch (error) {
    console.error('Error al obtener el diario del usuario:', error);
    res.status(500).json({
      mensaje: 'Error al obtener el diario del usuario',
      error: error.message
    });
  }
};