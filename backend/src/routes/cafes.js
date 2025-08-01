// routes/cafes.js - Rutas actualizadas
import express from 'express';
import { 
  getAllCafes, 
  createCafe, 
  getCafeById, 
  deleteCafe, 
  getNearbyCafes,
  asignarEtiquetas,
  agregarEtiquetas,
  quitarEtiqueta
} from '../controllers/cafeController.js';

const router = express.Router();

// Rutas existentes
router.get('/', getAllCafes);
router.post('/', createCafe);
router.get('/nearby', getNearbyCafes);
router.get('/:id', getCafeById);
router.delete('/:id', deleteCafe);

// Nuevas rutas para manejar etiquetas
router.post('/:id/etiquetas', asignarEtiquetas);           // Reemplazar todas las etiquetas
router.post('/:id/etiquetas/agregar', agregarEtiquetas);   // Agregar etiquetas sin reemplazar
router.delete('/:id/etiquetas/:etiquetaId', quitarEtiqueta); // Quitar etiqueta específica

export default router;