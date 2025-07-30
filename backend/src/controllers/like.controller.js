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

    let liked;
    if (existingLike) {
      // Si existe, eliminar el like
      await existingLike.destroy();
      liked = false;
    } else {
      // Si no existe, crear nuevo like
      await Like.create({
        userId,
        visitaId
      });
      liked = true;
    }

    // Obtener el nuevo conteo de likes
    const likesCount = await Like.count({
      where: { visitaId }
    });

    res.json({ 
      liked, 
      likesCount,
      message: liked ? 'Like agregado exitosamente' : 'Like removido exitosamente' 
    });
  } catch (error) {
    console.error('Error al procesar like:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

export const getLikeStatus = async (req, res) => {
  try {
    const { visitaId } = req.params;
    const userId = req.user.id;

    // Verificar si la visita existe
    const visita = await Visita.findByPk(visitaId);
    if (!visita) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    const like = await Like.findOne({
      where: {
        userId,
        visitaId
      }
    });

    // Obtener el conteo de likes
    const likesCount = await Like.count({
      where: { visitaId }
    });

    res.json({ 
      liked: !!like,
      likesCount
    });
  } catch (error) {
    console.error('Error al obtener estado del like:', error);
    res.status(500).json({ message: 'Error al obtener estado del like' });
  }
};

export const getLikedVisitas = async (req, res) => {
  try {
    const userId = req.user.id;

    // Primero verificar si el usuario tiene likes
    const hasLikes = await Like.findOne({
      where: { userId }
    });

    if (!hasLikes) {
      return res.status(200).json({
        message: '¡Aún no has dado like a ninguna visita! 🌟 Explora las visitas de otros usuarios y marca las que más te gusten.',
        visitas: [],
        sugerencia: 'Puedes empezar explorando las visitas más recientes y dar like a las que te interesen.'
      });
    }

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

    if (likedVisitas.length === 0) {
      return res.status(200).json({
        message: '¡Aún no has dado like a ninguna visita! 🌟 Explora las visitas de otros usuarios y marca las que más te gusten.',
        visitas: [],
        sugerencia: 'Puedes empezar explorando las visitas más recientes y dar like a las que te interesen.'
      });
    }

    // Transformar los datos y agregar el conteo de likes
    const formattedVisitas = await Promise.all(likedVisitas.map(async (visita) => {
      const likesCount = await Like.count({
        where: { visitaId: visita.id }
      });

      return {
        id: visita.id,
        comentario: visita.comentario,
        calificacion: visita.calificacion,
        fecha: visita.fecha,
        likesCount,
        imagenes: visita.visitaImagenes.map(img => ({
          imageUrl: img.imageUrl,
          orden: img.orden
        })),
        cafeteria: visita.cafeteria ? {
          id: visita.cafeteria.id,
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
      };
    }));

    res.json({
      message: 'Visitas con like recuperadas exitosamente',
      totalVisitas: formattedVisitas.length,
      visitas: formattedVisitas
    });
  } catch (error) {
    console.error('Error al obtener visitas con like:', error);
    res.status(500).json({ 
      message: 'Error al obtener visitas con like',
      error: error.message 
    });
  }
}; 