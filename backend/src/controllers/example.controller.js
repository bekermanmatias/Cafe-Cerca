import Example from '../models/Example.js';

export const getAll = async (req, res) => {
  try {
    const examples = await Example.findAll();
    res.json(examples);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo registros' });
  }
};

export const create = async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'El nombre es requerido' });
  }

  try {
    const example = await Example.create({ name });
    res.status(201).json(example);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creando registro' });
  }
};

export default {
  getAll,
  create
};