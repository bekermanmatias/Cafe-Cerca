import { Like, Visita, User, Cafe, VisitaImagen } from '../models/index.js';

export const toggleLike = async (req, res) => {
  try {
    const { visitaId } = req.params;
    const userId = req.user.id;

    // Verificar si la visita existe
    const visita = await Visita.findByPk(visitaId);
    if (!visita) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    // Buscar si ya existe un like
    const existingLike = await Like.findOne({
      where: {
        userId,
        visitaId
      }
    });

    if (existingLike) {
      // Si existe, eliminar el like
      await existingLike.destroy();
      res.json({ liked: false, message: 'Like removido exitosamente' });
    } else {
      // Si no existe, crear nuevo like
      await Like.create({
        userId,
        visitaId
      });
      res.json({ liked: true, message: 'Like agregado exitosamente' });
    }
  } catch (error) {
    console.error('Error al procesar like:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

export const getLikeStatus = async (req, res) => {
  try {
    const { visitaId } = req.params;
    const userId = req.user.id;

    const like = await Like.findOne({
      where: {
        userId,
        visitaId
      }
    });

    res.json({ liked: !!like });
  } catch (error) {
    console.error('Error al obtener estado del like:', error);
    res.status(500).json({ message: 'Error al obtener estado del like' });
  }
};

export const getLikedVisitas = async (req, res) => {
  try {
    const userId = req.user.id;

    const likedVisitas = await Visita.findAll({
      include: [
        {
          model: Like,
          as: 'likes',
          where: { userId },
          required: true
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: Cafe,
          as: 'cafeteria',
          attributes: ['id', 'name', 'address', 'imageUrl', 'rating']
        },
        {
          model: VisitaImagen,
          as: 'visitaImagenes',
          attributes: ['imageUrl', 'orden']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transformar los datos para que coincidan con el formato esperado por el frontend
    const formattedVisitas = likedVisitas.map(visita => ({
      id: visita.id,
      comentario: visita.comentario,
      calificacion: visita.calificacion,
      fecha: visita.fecha,
      imagenes: visita.visitaImagenes.map(img => ({
        imageUrl: img.imageUrl,
        orden: img.orden
      })),
      cafeteria: visita.cafeteria ? {
        name: visita.cafeteria.name,
        address: visita.cafeteria.address,
        imageUrl: visita.cafeteria.imageUrl,
        rating: visita.cafeteria.rating
      } : null,
      usuario: visita.usuario ? {
        id: visita.usuario.id,
        name: visita.usuario.name,
        profileImage: visita.usuario.profileImage
      } : null
    }));

    res.json(formattedVisitas);
  } catch (error) {
    console.error('Error al obtener visitas con like:', error);
    res.status(500).json({ message: 'Error al obtener visitas con like' });
  }
}; 