import { SavedCafe, Cafe } from '../models/index.js';

export const toggleSavedCafe = async (req, res) => {
  try {
    const { cafeId } = req.params;
    const userId = req.user.id;

    // Verificar si la cafetería existe
    const cafe = await Cafe.findByPk(cafeId);
    if (!cafe) {
      return res.status(404).json({ message: 'Cafetería no encontrada' });
    }

    // Buscar si ya está guardada
    const existingSave = await SavedCafe.findOne({
      where: {
        userId,
        cafeId
      }
    });

    let saved;
    if (existingSave) {
      // Si existe, eliminar el guardado
      await existingSave.destroy();
      saved = false;
    } else {
      // Si no existe, guardar la cafetería
      await SavedCafe.create({
        userId,
        cafeId
      });
      saved = true;
    }

    res.json({ 
      saved,
      message: saved ? 'Cafetería guardada exitosamente' : 'Cafetería removida de guardados' 
    });
  } catch (error) {
    console.error('Error al procesar guardado:', error);
    res.status(500).json({ 
      message: 'Error al procesar la solicitud',
      error: error.message 
    });
  }
};

export const getSavedStatus = async (req, res) => {
  try {
    const { cafeId } = req.params;
    const userId = req.user.id;

    // Verificar si la cafetería existe
    const cafe = await Cafe.findByPk(cafeId);
    if (!cafe) {
      return res.status(404).json({ message: 'Cafetería no encontrada' });
    }

    const savedCafe = await SavedCafe.findOne({
      where: {
        userId,
        cafeId
      }
    });

    res.json({ saved: !!savedCafe });
  } catch (error) {
    console.error('Error al obtener estado de guardado:', error);
    res.status(500).json({ 
      message: 'Error al obtener estado de guardado',
      error: error.message 
    });
  }
};

export const getSavedCafes = async (req, res) => {
  try {
    const userId = req.user.id;

    const savedCafes = await SavedCafe.findAll({
      where: { userId },
      include: [{
        model: Cafe,
        as: 'cafe',
        attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'tags', 'openingHours', 'lat', 'lng']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Transformar los datos para enviar solo la información de las cafeterías
    const cafes = savedCafes.map(saved => saved.cafe).filter(cafe => cafe !== null);

    if (cafes.length === 0) {
      return res.status(200).json({
        message: '¡Aún no tienes cafeterías guardadas! 🌟 Explora las cafeterías y guarda tus favoritas.',
        cafes: [],
        sugerencia: 'Puedes empezar explorando las cafeterías cercanas y guardar las que te interesen para visitarlas más tarde.'
      });
    }

    res.json({
      message: 'Cafeterías guardadas recuperadas exitosamente',
      totalCafes: cafes.length,
      cafes
    });
  } catch (error) {
    console.error('Error al obtener cafeterías guardadas:', error);
    res.status(500).json({ 
      message: 'Error al obtener cafeterías guardadas',
      error: error.message 
    });
  }
}; 