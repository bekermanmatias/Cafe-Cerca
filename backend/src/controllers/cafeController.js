import { Cafe, Visita, User, VisitaImagen, Like, VisitaParticipante, Resena } from '../models/index.js';
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
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;



    const cafe = await Cafe.findByPk(id);
    if (!cafe) {
      return res.status(404).json({ mensaje: 'Cafetería no encontrada' });
    }



    // Obtener todas las visitas de la cafetería con toda la información necesaria
    const { count, rows: visitas } = await Visita.findAndCountAll({
      where: { cafeteriaId: id },
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
          ],
          required: false
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

    // Transformar las visitas para que tengan la misma estructura que en diary
    const visitasTransformadas = visitas.map(visita => {
      const visitaJSON = visita.toJSON();
      const creador = visitaJSON.usuario;
      const resenaCreador = visitaJSON.resenas?.find(r => r.usuarioId === creador?.id);

      return {
        id: visitaJSON.id,
        fecha: visitaJSON.fecha,
        estado: visitaJSON.estado,
        esCompartida: visitaJSON.esCompartida,
        cafeteria: visitaJSON.cafeteria,
        imagenes: visitaJSON.visitaImagenes || [],
        likesCount: visitaJSON.likes?.length || 0,
        // Estructura completa como en diary
        creador: creador ? {
          id: creador.id,
          name: creador.name,
          profileImage: creador.profileImage,
          resena: resenaCreador ? {
            id: resenaCreador.id,
            calificacion: resenaCreador.calificacion,
            comentario: resenaCreador.comentario,
            fecha: resenaCreador.createdAt,
            usuario: {
              id: creador.id,
              name: creador.name,
              profileImage: creador.profileImage
            }
          } : null
        } : null,
        participantes: (visitaJSON.participantes || [])
          .filter(p => p.rol !== 'creador')
          .map(p => ({
            id: p.usuario.id,
            name: p.usuario.name,
            profileImage: p.usuario.profileImage,
            estado: p.estado,
            rol: p.rol,
            fechaRespuesta: p.fechaRespuesta,
            resena: visitaJSON.resenas?.find(r => r.usuarioId === p.usuarioId) ? {
              id: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).id,
              calificacion: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).calificacion,
              comentario: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).comentario,
              fecha: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).createdAt,
              usuario: {
                id: p.usuario.id,
                name: p.usuario.name,
                profileImage: p.usuario.profileImage
              }
            } : null
          })),
        // Compatibilidad con estructura antigua
        usuario: creador,
        comentario: resenaCreador?.comentario,
        calificacion: resenaCreador?.calificacion
      };
    });

    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;



    res.json({
      cafe,
      visitas: {
        items: visitasTransformadas,
        total: count,
        totalPages,
        currentPage: page,
        hasMore
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener cafetería:', error);
    res.status(500).json({ mensaje: 'Error al obtener la cafetería', error: error.message });
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