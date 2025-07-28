import express from 'express';
import { getEstadisticasUsuario } from '../controllers/estadisticas.controller.js';

const router = express.Router();

// GET - Obtener estadísticas de un usuario
router.get('/usuarios/:usuarioId', getEstadisticasUsuario);

export default router; 