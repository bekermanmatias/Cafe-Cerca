import Cafe from '../models/Cafe.js';
import Visita from '../models/Visita.js';
import VisitaImagen from '../models/VisitaImagen.js';
import { Op } from 'sequelize';

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
    const { name, address, rating, tags, openingHours, lat, lng } = req.body;

    // Convierte lat y lng de string a float
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: 'Latitud o longitud inválida' });
    }

    const imageUrl = req.file ? req.file.path : null;
    const tagsParsed = tags ? JSON.parse(tags) : [];

    const cafe = await Cafe.create({
      name,
      address,
      rating: rating ? parseFloat(rating) : 0.0,
      imageUrl,
      tags: tagsParsed,
      openingHours,
      lat: latNum,
      lng: lngNum
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
      
      // Obtener las reseñas paginadas
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

export const deleteCafe = async (req, res) => {
  try {
    const rows = await Cafe.destroy({ where: { id: req.params.id } });
    if (rows === 0) return res.status(404).json({ error: 'No encontrada' });
    res.json({ mensaje: 'Cafetería eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

export const getNearbyCafes = async (req, res) => {
  const { lat, lng, radius = 5 } = req.query; // radius en km
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Faltan lat y lng en la query' });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const radiusInDegrees = radius / 111; // aproximación simple (1 grado ≈ 111km)

  try {
    const cafes = await Cafe.findAll({
      where: {
        lat: {
          [Op.between]: [latNum - radiusInDegrees, latNum + radiusInDegrees],
        },
        lng: {
          [Op.between]: [lngNum - radiusInDegrees, lngNum + radiusInDegrees],
        },
      },
    });
    res.json(cafes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};