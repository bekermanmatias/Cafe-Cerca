import express from 'express';
import { 
  getComentariosByVisita, 
  createComentario, 
  updateComentario, 
  deleteComentario 
} from '../controllers/comentarios.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.get('/visita/:visitaId/comentarios', getComentariosByVisita);

// Rutas protegidas que requieren autenticación
router.post('/visita/:visitaId/comentarios', verifyToken, createComentario);
router.put('/comentarios/:id', verifyToken, updateComentario);
router.delete('/comentarios/:id', verifyToken, deleteComentario);

export default router; 