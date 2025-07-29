import { SavedCafe, Cafe } from '../models/index.js';

export const toggleSavedCafe = async (req, res) => {
  try {
    const { cafeId } = req.params;
    const userId = req.user.id;

    console.log('Intentando guardar/quitar cafetería:', { cafeId, userId });

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

    console.log('Operación completada:', { saved, cafeId, userId });

    res.json({ 
      saved,
      message: saved ? 'Cafetería guardada exitosamente' : 'Cafetería removida de guardados' 
    });
  } catch (error) {
    console.error('Error detallado al procesar guardado:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

export const getSavedStatus = async (req, res) => {
  try {
    const { cafeId } = req.params;
    const userId = req.user.id;

    console.log('Verificando estado de guardado:', { cafeId, userId });

    const savedCafe = await SavedCafe.findOne({
      where: {
        userId,
        cafeId
      }
    });

    console.log('Estado de guardado:', { saved: !!savedCafe, cafeId, userId });

    res.json({ saved: !!savedCafe });
  } catch (error) {
    console.error('Error detallado al obtener estado de guardado:', error);
    res.status(500).json({ message: 'Error al obtener estado de guardado' });
  }
};

export const getSavedCafes = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('Obteniendo cafeterías guardadas para usuario:', userId);

    const savedCafes = await SavedCafe.findAll({
      where: { userId },
      include: [{
        model: Cafe,
        as: 'cafe',
        attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'tags', 'openingHours']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Transformar los datos para enviar solo la información de las cafeterías
    const cafes = savedCafes.map(saved => saved.cafe);

    console.log('Cafeterías guardadas encontradas:', cafes.length);

    res.json(cafes);
  } catch (error) {
    console.error('Error detallado al obtener cafeterías guardadas:', error);
    res.status(500).json({ message: 'Error al obtener cafeterías guardadas' });
  }
}; 