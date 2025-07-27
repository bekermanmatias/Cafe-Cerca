// routes/cafes.js
import express from 'express';
import Cafe from '../models/Cafe.js';
import { upload } from '../config/cloudinary.js'; // ya lo tenés, genial

const router = express.Router();

// GET - Todas las cafeterías
router.get('/', async (req, res) => {
  try {
    const cafes = await Cafe.findAll();
    res.json(cafes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener las cafeterías' });
  }
});

// POST - Crear nueva cafetería
router.post('/', upload.single('image'), async (req, res) => {
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
});

// DELETE - Borrar una cafetería (opcional)
router.delete('/:id', async (req, res) => {
  try {
    const rows = await Cafe.destroy({ where: { id: req.params.id } });
    if (rows === 0) return res.status(404).json({ error: 'No encontrada' });
    res.json({ mensaje: 'Cafetería eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

export default router;
