import express from 'express';
import { getEstadisticasUsuario } from '../controllers/estadisticas.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET - Obtener estadísticas de un usuario
router.get('/usuarios/:usuarioId', verifyToken, getEstadisticasUsuario);

export default router; 