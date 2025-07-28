import express from 'express';
import {
  getComentariosByVisita,
  createComentario,
  updateComentario,
  deleteComentario
} from '../controllers/comentario.controller.js';

const router = express.Router();

// Obtener todos los comentarios de una visita
router.get('/visita/:visitaId/comentarios', getComentariosByVisita);

// Crear un nuevo comentario en una visita
router.post('/visita/:visitaId/comentarios', createComentario);

// Actualizar un comentario específico
router.put('/comentarios/:id', updateComentario);

// Eliminar un comentario específico
router.delete('/comentarios/:id', deleteComentario);

export default router; 