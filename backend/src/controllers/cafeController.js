import { Cafe, Visita, User, VisitaImagen, Like, VisitaParticipante, Resena, Etiqueta } from '../models/index.js';
import { Op } from 'sequelize';

export const getAllCafes = async (req, res) => {
  try {
    const { etiquetas, lat, lng, radio = 10 } = req.query;

    let whereClause = {};
    let include = [{
      model: Etiqueta,
      as: 'etiquetas',
      through: { attributes: [] }, // Excluir campos de la tabla intermedia
      where: { activo: true },
      required: false // LEFT JOIN para obtener cafés aunque no tengan etiquetas
    }];

    // Si hay filtros de etiquetas específicas
    if (etiquetas) {
      const etiquetaIds = etiquetas.split(',').map(id => parseInt(id));
      include[0].where = {
        ...include[0].where,
        id: etiquetaIds
      };
      include[0].required = true; // INNER JOIN cuando se filtran etiquetas
    }

    // Si hay coordenadas, filtrar por radio
    if (lat && lng) {
      const latFloat = parseFloat(lat);
      const lngFloat = parseFloat(lng);
      const radioKm = parseFloat(radio);
      
      // Cálculo aproximado de radio en grados
      const latRadio = radioKm / 111; // 1 grado ≈ 111 km
      const lngRadio = radioKm / (111 * Math.cos(latFloat * Math.PI / 180));
      
      whereClause = {
        lat: {
          [Op.between]: [latFloat - latRadio, latFloat + latRadio]
        },
        lng: {
          [Op.between]: [lngFloat - lngRadio, lngFloat + lngRadio]
        }
      };
    }

    const cafes = await Cafe.findAll({
      include,
      where: whereClause,
      order: [
        ['name', 'ASC'],
        [{ model: Etiqueta, as: 'etiquetas' }, 'nombre', 'ASC']
      ]
    });

    // Si hay coordenadas del usuario, calcular distancias
    if (lat && lng) {
      const cafesConDistancia = cafes.map(cafe => {
        const distance = calculateDistance(
          parseFloat(lat), 
          parseFloat(lng), 
          cafe.lat, 
          cafe.lng
        );
        return {
          ...cafe.toJSON(),
          distance: Math.round(distance * 10) / 10 // Redondear a 1 decimal
        };
      }).sort((a, b) => a.distance - b.distance);
      
      return res.json(cafesConDistancia);
    }

    res.json(cafes);
  } catch (err) {
    console.error('Error al obtener cafeterías:', err);
    res.status(500).json({ error: 'Error al obtener las cafeterías', details: err.message });
  }
};

export const createCafe = async (req, res) => {
  try {
    const { name, address, rating, openingHours, lat, lng, etiquetaIds = [] } = req.body;

    // Validaciones básicas
    if (!name || !address || !lat || !lng) {
      return res.status(400).json({ 
        error: 'Nombre, dirección, latitud y longitud son requeridos' 
      });
    }

    // Convierte lat y lng de string a float
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: 'Latitud o longitud inválida' });
    }

    // Verificar si ya existe un café similar
    const cafeExistente = await Cafe.findOne({
      where: {
        name: name.trim(),
        address: address.trim()
      }
    });

    if (cafeExistente) {
      return res.status(400).json({ 
        error: 'Ya existe un café con ese nombre y dirección' 
      });
    }

    const imageUrl = req.file ? req.file.path : null;

    // Crear el café
    const cafe = await Cafe.create({
      name: name.trim(),
      address: address.trim(),
      rating: rating ? parseFloat(rating) : 0.0,
      imageUrl,
      openingHours,
      lat: latNum,
      lng: lngNum
    });

    // Asignar etiquetas si se proporcionaron
    if (etiquetaIds.length > 0) {
      // Verificar que las etiquetas existen y están activas
      const etiquetasValidas = await Etiqueta.findAll({
        where: { 
          id: etiquetaIds,
          activo: true 
        }
      });

      if (etiquetasValidas.length > 0) {
        await cafe.setEtiquetas(etiquetasValidas.map(e => e.id));
      }
    }

    // Retornar café completo con etiquetas
    const cafeCompleto = await Cafe.findByPk(cafe.id, {
      include: [{
        model: Etiqueta,
        as: 'etiquetas',
        through: { attributes: [] }
      }]
    });

    res.status(201).json(cafeCompleto);
  } catch (err) {
    console.error('Error al crear cafetería:', err);
    res.status(400).json({ error: 'Error al crear la cafetería', details: err.message });
  }
};

export const getCafeById = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;

    // Obtener el café con sus etiquetas
    const cafe = await Cafe.findByPk(id, {
      include: [{
        model: Etiqueta,
        as: 'etiquetas',
        through: { attributes: [] },
        where: { activo: true },
        required: false
      }]
    });

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
          attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'openingHours'],
          include: [{
            model: Etiqueta,
            as: 'etiquetas',
            through: { attributes: [] },
            where: { activo: true },
            required: false
          }]
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
    console.error('Error al eliminar cafetería:', err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

export const getNearbyCafes = async (req, res) => {
  const { lat, lng, radius = 5, etiquetas } = req.query; // radius en km
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Faltan lat y lng en la query' });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const radiusInDegrees = radius / 111; // aproximación simple (1 grado ≈ 111km)

  try {
    let include = [{
      model: Etiqueta,
      as: 'etiquetas',
      through: { attributes: [] },
      where: { activo: true },
      required: false
    }];

    // Si hay filtros de etiquetas
    if (etiquetas) {
      const etiquetaIds = etiquetas.split(',').map(id => parseInt(id));
      include[0].where = {
        ...include[0].where,
        id: etiquetaIds
      };
      include[0].required = true;
    }

    const cafes = await Cafe.findAll({
      where: {
        lat: {
          [Op.between]: [latNum - radiusInDegrees, latNum + radiusInDegrees],
        },
        lng: {
          [Op.between]: [lngNum - radiusInDegrees, lngNum + radiusInDegrees],
        },
      },
      include,
      order: [
        ['name', 'ASC'],
        [{ model: Etiqueta, as: 'etiquetas' }, 'nombre', 'ASC']
      ]
    });

    // Calcular distancias reales y ordenar por distancia
    const cafesConDistancia = cafes.map(cafe => {
      const distance = calculateDistance(latNum, lngNum, cafe.lat, cafe.lng);
      return {
        ...cafe.toJSON(),
        distance: Math.round(distance * 10) / 10
      };
    })
    .filter(cafe => cafe.distance <= parseFloat(radius)) // Filtrar por radio exacto
    .sort((a, b) => a.distance - b.distance);

    res.json(cafesConDistancia);
  } catch (error) {
    console.error('Error al obtener cafés cercanos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Nuevas funciones para manejar etiquetas de cafés
export const asignarEtiquetas = async (req, res) => {
  try {
    const { id } = req.params;
    const { etiquetaIds, creadoPor } = req.body;

    const cafe = await Cafe.findByPk(id);
    if (!cafe) {
      return res.status(404).json({ error: 'Café no encontrado' });
    }

    // Verificar que todas las etiquetas existen y están activas
    const etiquetas = await Etiqueta.findAll({
      where: { 
        id: etiquetaIds,
        activo: true 
      }
    });

    if (etiquetas.length !== etiquetaIds.length) {
      return res.status(400).json({ 
        error: 'Una o más etiquetas no existen o están inactivas' 
      });
    }

    // Reemplazar todas las etiquetas
    await cafe.setEtiquetas(etiquetaIds, {
      through: { creadoPor }
    });

    // Retornar café actualizado
    const cafeActualizado = await Cafe.findByPk(id, {
      include: [{
        model: Etiqueta,
        as: 'etiquetas',
        through: { attributes: [] }
      }]
    });

    res.json(cafeActualizado);
  } catch (error) {
    console.error('Error al asignar etiquetas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

export const agregarEtiquetas = async (req, res) => {
  try {
    const { id } = req.params;
    const { etiquetaIds, creadoPor } = req.body;

    const cafe = await Cafe.findByPk(id);
    if (!cafe) {
      return res.status(404).json({ error: 'Café no encontrado' });
    }

    // Verificar etiquetas
    const etiquetas = await Etiqueta.findAll({
      where: { 
        id: etiquetaIds,
        activo: true 
      }
    });

    if (etiquetas.length !== etiquetaIds.length) {
      return res.status(400).json({ 
        error: 'Una o más etiquetas no existen o están inactivas' 
      });
    }

    // Agregar etiquetas (sin reemplazar)
    await cafe.addEtiquetas(etiquetaIds, {
      through: { creadoPor }
    });

    const cafeActualizado = await Cafe.findByPk(id, {
      include: [{
        model: Etiqueta,
        as: 'etiquetas',
        through: { attributes: [] }
      }]
    });

    res.json(cafeActualizado);
  } catch (error) {
    console.error('Error al agregar etiquetas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

export const quitarEtiqueta = async (req, res) => {
  try {
    const { id, etiquetaId } = req.params;

    const cafe = await Cafe.findByPk(id);
    if (!cafe) {
      return res.status(404).json({ error: 'Café no encontrado' });
    }

    // Quitar la etiqueta específica
    await cafe.removeEtiqueta(etiquetaId);

    const cafeActualizado = await Cafe.findByPk(id, {
      include: [{
        model: Etiqueta,
        as: 'etiquetas',
        through: { attributes: [] }
      }]
    });

    res.json(cafeActualizado);
  } catch (error) {
    console.error('Error al quitar etiqueta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Función auxiliar para calcular distancia
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}