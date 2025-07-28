import Cafe from '../models/Cafe.js';

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
    const cafe = await Cafe.findByPk(req.params.id);
    if (!cafe) return res.status(404).json({ error: 'Cafetería no encontrada' });
    res.json(cafe);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener la cafetería' });
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
