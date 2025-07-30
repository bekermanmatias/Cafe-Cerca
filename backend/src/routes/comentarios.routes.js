import express from 'express';
import { 
  getComentariosByVisita, 
  createComentario, 
  updateComentario, 
  deleteComentario 
} from '../controllers/comentario.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación para obtener la información del usuario
router.get('/visita/:visitaId', verifyToken, getComentariosByVisita);
router.post('/visita/:visitaId', verifyToken, createComentario);
router.put('/:id', verifyToken, updateComentario);
router.delete('/:id', verifyToken, deleteComentario);

export default router; 