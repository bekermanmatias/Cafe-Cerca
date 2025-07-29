import { Cafe, Visita, User, VisitaImagen, Like } from '../models/index.js';

export const getAllCafes = async (req, res) => {
  try {
    const cafes = await Cafe.findAll();
    res.json(cafes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener las cafeterías' });
  }
};

export const createCafe = async (req, res) => {
  try {
    const { name, address, rating, tags, openingHours } = req.body;

    const imageUrl = req.file ? req.file.path : null;
    const tagsParsed = tags ? JSON.parse(tags) : [];

    const cafe = await Cafe.create({
      name,
      address,
      rating,
      imageUrl,
      tags: tagsParsed,
      openingHours
    });

    res.status(201).json(cafe);
  } catch (err) {
    res.status(400).json({ error: 'Error al crear la cafetería', details: err.message });
  }
};

export const getCafeById = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;

    const cafe = await Cafe.findByPk(id);
    if (!cafe) {
      return res.status(404).json({ mensaje: 'Cafetería no encontrada' });
    }

    const { count, rows: reseñas } = await Visita.findAndCountAll({
      where: { cafeteriaId: id },
      include: [
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
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Transformar las reseñas para incluir el conteo de likes
    const reseñasConLikes = reseñas.map(reseña => {
      const reseñaJSON = reseña.toJSON();
      return {
        ...reseñaJSON,
        likesCount: reseñaJSON.likes.length,
        likes: undefined // Removemos el array de likes ya que solo necesitamos el conteo
      };
    });

    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;

    res.json({
      cafe,
      reseñas: {
        items: reseñasConLikes,
        total: count,
        totalPages,
        currentPage: page,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error al obtener cafetería:', error);
    res.status(500).json({ mensaje: 'Error al obtener la cafetería' });
  }
};

export const deleteCafe = async (req, res) => {
  try {
    const rows = await Cafe.destroy({ where: { id: req.params.id } });
    if (rows === 0) return res.status(404).json({ error: 'No encontrada' });
    res.json({ mensaje: 'Cafetería eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};
