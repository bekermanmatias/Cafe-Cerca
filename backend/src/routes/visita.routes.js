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

// Rutas
router.post('/visitas', upload.array('imagenes', 5), crearVisita);
router.get('/visitas', obtenerVisitas);
router.get('/visitas/:id', obtenerVisitaPorId);
router.put('/visitas/:id', upload.array('imagenes', 5), actualizarVisita);
router.delete('/visitas/:id', eliminarVisita);

// Ruta para el diario de un usuario
router.get('/usuarios/:usuarioId/diario', obtenerDiarioUsuario);

export default router;