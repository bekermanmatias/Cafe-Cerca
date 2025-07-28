import express from 'express';
import { 
  crearVisita, 
  obtenerVisitas, 
  obtenerVisitaPorId,
  actualizarVisita,
  eliminarVisita,
  obtenerDiarioUsuario 
} from '../controllers/visita.controller.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Rutas básicas de visitas
router.post('/', upload.array('imagenes', 5), crearVisita);
router.get('/', obtenerVisitas);
router.get('/:id', obtenerVisitaPorId);
router.put('/:id', upload.array('imagenes', 5), actualizarVisita);
router.delete('/:id', eliminarVisita);

// Ruta para el diario de un usuario
router.get('/usuario/:usuarioId', obtenerDiarioUsuario);

export default router;