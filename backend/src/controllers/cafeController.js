import Cafe from '../models/Cafe.js';
import Visita from '../models/Visita.js';
import VisitaImagen from '../models/VisitaImagen.js';
import { User } from '../models/index.js';

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
    const { page = 1, limit = 3 } = req.query; // Por defecto, página 1 y 3 reseñas
    const offset = (page - 1) * limit;

    console.log(`Buscando cafetería con ID: ${req.params.id}`);
    // Primero verificamos si la cafetería existe
    const cafe = await Cafe.findByPk(req.params.id);
    if (!cafe) {
      return res.status(404).json({ error: 'Cafetería no encontrada' });
    }

    try {
      console.log(`Buscando reseñas para cafetería ID: ${req.params.id}`);
      console.log(`Parámetros de paginación: limit=${limit}, offset=${offset}`);
      
      // Obtener las reseñas paginadas con información del usuario
      const reseñas = await Visita.findAndCountAll({
        where: { 
          cafeteriaId: req.params.id 
        },
        include: [
          {
            model: VisitaImagen,
            as: 'visitaImagenes',
            attributes: ['imageUrl', 'orden'],
            required: false
          },
          {
            model: User,
            as: 'usuario',
            attributes: ['id', 'name', 'profileImage'],
            required: false
          }
        ],
        attributes: [
          'id',
          'usuarioId',
          'comentario',
          'calificacion',
          'fecha',
          'createdAt'
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true
      });

      console.log(`Reseñas encontradas: ${reseñas.count}`);

      // Calcular el total de páginas
      const totalPages = Math.ceil(reseñas.count / limit);

      res.json({
        cafe,
        reseñas: {
          items: reseñas.rows,
          total: reseñas.count,
          totalPages,
          currentPage: parseInt(page),
          hasMore: page < totalPages
        }
      });
    } catch (error) {
      console.error('Error detallado al obtener reseñas:', error);
      console.error('Stack trace:', error.stack);
      
      // Si falla al obtener las reseñas, al menos devolvemos la info de la cafetería
      res.json({
        cafe,
        reseñas: {
          items: [],
          total: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          hasMore: false,
          error: 'Error al cargar las reseñas',
          errorDetails: error.message
        }
      });
    }
  } catch (err) {
    console.error('Error detallado:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      error: 'Error al obtener la cafetería y reseñas',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
export const updateCafe = async (req, res) => {
  try {
    const { name, address, rating, tags, openingHours, lat, lng } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    // Buscar la cafetería por ID
    const cafe = await Cafe.findByPk(req.params.id);
    if (!cafe) return res.status(404).json({ error: 'Cafetería no encontrada' });

    // Parsear tags si es necesario
    const tagsParsed = typeof tags === 'string' ? JSON.parse(tags) : tags;

    // Actualizar campos
    await cafe.update({
      name: name ?? cafe.name,
      address: address ?? cafe.address,
      rating: rating ?? cafe.rating,
      tags: tagsParsed ?? cafe.tags,
      openingHours: openingHours ?? cafe.openingHours,
      lat: lat ?? cafe.lat,
      lng: lng ?? cafe.lng,
      imageUrl: imageUrl ?? cafe.imageUrl
    });

    res.json(cafe);
  } catch (err) {
    res.status(400).json({ error: 'Error al actualizar la cafetería', details: err.message });
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
