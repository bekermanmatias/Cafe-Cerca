import { Visita, Cafe, User, VisitaImagen, Like } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

// Función helper para incluir las imágenes en las consultas
const includeImagenes = {
  model: VisitaImagen,
  as: 'visitaImagenes',
  attributes: ['imageUrl', 'orden']
};

// Función helper para incluir la cafetería
const includeCafeteria = {
  model: Cafe,
  as: 'cafeteria',
  attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'tags', 'openingHours']
};

// Función helper para incluir el usuario
const includeUsuario = {
  model: User,
  as: 'usuario',
  attributes: ['id', 'name', 'profileImage']
};

// Función helper para ordenar las imágenes
const orderOptions = [
  ['fecha', 'DESC'],
  [{ model: VisitaImagen, as: 'visitaImagenes' }, 'orden', 'ASC']
];

export const crearVisita = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    // Usar el ID del usuario del token de autenticación
    const usuarioId = req.user.id;
    const { cafeteriaId, comentario, calificacion } = req.body;
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
      include: [includeImagenes, includeCafeteria, includeUsuario],
      order: orderOptions
    });

    const visitasTransformadas = visitas.map(visita => ({
      ...visita.toJSON(),
      imagenes: visita.visitaImagenes
    }));

    res.json({
      mensaje: 'Visitas recuperadas exitosamente',
      totalVisitas: visitas.length,
      visitas: visitasTransformadas
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
      include: [includeImagenes, includeCafeteria, includeUsuario],
      order: orderOptions
    });
    
    if (!visita) {
      return res.status(404).json({ mensaje: 'Visita no encontrada' });
    }

    const visitaTransformada = {
      ...visita.toJSON(),
      imagenes: visita.visitaImagenes
    };
    
    res.json({
      mensaje: 'Visita recuperada exitosamente',
      visita: visitaTransformada
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
    const { usuarioId, cafeteriaId, comentario, calificacion, imagenesExistentes } = req.body;
    const imagenes = req.files;

    console.log('Datos recibidos:', {
      id,
      usuarioId,
      cafeteriaId,
      comentario,
      calificacion,
      imagenesExistentes,
      'Número de imágenes nuevas': imagenes?.length || 0
    });

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

    // Procesar las imágenes existentes
    let imagenesExistentesArray = [];
    try {
      imagenesExistentesArray = imagenesExistentes ? JSON.parse(imagenesExistentes) : [];
      console.log('Imágenes existentes parseadas:', imagenesExistentesArray);
    } catch (error) {
      console.error('Error al parsear imagenesExistentes:', error);
      imagenesExistentesArray = [];
    }

    // Si hay imágenes existentes, eliminar las que no están en la lista
    if (imagenesExistentesArray.length > 0) {
      console.log('Eliminando imágenes no incluidas en:', imagenesExistentesArray);
      await VisitaImagen.destroy({
        where: {
          visitaId: id,
          imageUrl: {
            [Op.notIn]: imagenesExistentesArray
          }
        },
        transaction: t
      });
    } else {
      console.log('No hay imágenes existentes, eliminando todas las imágenes anteriores');
      // Si no hay imágenes existentes, eliminar todas las imágenes anteriores
      await VisitaImagen.destroy({
        where: { visitaId: id },
        transaction: t
      });
    }

    // Si hay nuevas imágenes, agregarlas
    if (imagenes && imagenes.length > 0) {
      const imagenesParaGuardar = imagenes.map((imagen, index) => ({
        visitaId: id,
        imageUrl: imagen.path,
        orden: imagenesExistentesArray.length + index + 1
      }));

      console.log('Guardando nuevas imágenes:', imagenesParaGuardar);
      await VisitaImagen.bulkCreate(imagenesParaGuardar, { transaction: t });
    }

    await t.commit();

    // Obtener la visita actualizada con sus imágenes
    const visitaActualizada = await Visita.findByPk(id, {
      include: [includeImagenes],
      order: orderOptions
    });

    console.log('Visita actualizada exitosamente');
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
    // Usar el ID del usuario del token
    const usuarioId = req.user.id;

    const visitas = await Visita.findAll({
      where: { usuarioId },
      include: [includeImagenes, includeCafeteria, includeUsuario],
      order: orderOptions
    });

    // Transformar la respuesta para mantener compatibilidad con el frontend
    const visitasTransformadas = visitas.map(visita => ({
      ...visita.toJSON(),
      imagenes: visita.visitaImagenes
    }));

    res.json({
      mensaje: visitasTransformadas.length > 0 ? 'Diario recuperado exitosamente' : 'No tienes visitas registradas',
      totalVisitas: visitas.length,
      visitas: visitasTransformadas
    });

  } catch (error) {
    console.error('Error al obtener el diario del usuario:', error);
    res.status(500).json({
      mensaje: 'Error al obtener el diario del usuario',
      error: error.message
    });
  }
};

export const getVisitasByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const visitas = await Visita.findAll({
      where: { usuarioId: userId },
      include: [
        {
          model: Cafe,
          as: 'cafeteria',
          attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'tags', 'openingHours']
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: VisitaImagen,
          as: 'visitaImagenes',
          attributes: ['imageUrl', 'orden']
        },
        {
          model: Like,
          as: 'likes'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transformar los datos y agregar el conteo de likes
    const visitasConLikes = visitas.map(visita => {
      const visitaJSON = visita.toJSON();
      return {
        ...visitaJSON,
        likesCount: visitaJSON.likes.length,
        likes: undefined // Removemos el array de likes ya que solo necesitamos el conteo
      };
    });

    res.json({
      mensaje: 'Visitas encontradas',
      totalVisitas: visitas.length,
      visitas: visitasConLikes
    });
  } catch (error) {
    console.error('Error al obtener visitas:', error);
    res.status(500).json({ mensaje: 'Error al obtener las visitas' });
  }
};

export const getVisitaById = async (req, res) => {
  try {
    const { id } = req.params;

    const visita = await Visita.findOne({
      where: { id },
      include: [
        {
          model: Cafe,
          as: 'cafeteria',
          attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'tags', 'openingHours']
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: VisitaImagen,
          as: 'visitaImagenes',
          attributes: ['imageUrl', 'orden']
        },
        {
          model: Like,
          as: 'likes'
        }
      ]
    });

    if (!visita) {
      return res.status(404).json({ mensaje: 'Visita no encontrada' });
    }

    // Agregar el conteo de likes a la respuesta
    const visitaJSON = visita.toJSON();
    const visitaConLikes = {
      ...visitaJSON,
      likesCount: visitaJSON.likes.length,
      likes: undefined // Removemos el array de likes ya que solo necesitamos el conteo
    };

    // Log para debug
    console.log('Enviando visita con likes:', {
      id: visitaConLikes.id,
      likesCount: visitaConLikes.likesCount
    });

    res.json({ mensaje: 'Visita encontrada', visita: visitaConLikes });
  } catch (error) {
    console.error('Error al obtener visita:', error);
    res.status(500).json({ mensaje: 'Error al obtener la visita' });
  }
};