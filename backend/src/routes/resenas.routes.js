import express from 'express';
import { 
  crearResena, 
  obtenerResenasVisita, 
  obtenerResenasUsuario, 
  actualizarResena, 
  eliminarResena 
} from '../controllers/resena.controller.js';
import { verifyToken as authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Crear una reseña
router.post('/', crearResena);

// Obtener reseñas de una visita específica
router.get('/visita/:visitaId', obtenerResenasVisita);

// Obtener reseñas de un usuario específico
router.get('/usuario/:usuarioId', obtenerResenasUsuario);

// Actualizar una reseña
router.put('/:resenaId', actualizarResena);

// Eliminar una reseña
router.delete('/:resenaId', eliminarResena);

export default router; 