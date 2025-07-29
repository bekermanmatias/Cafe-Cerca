import { Router } from 'express';
import { toggleLike, getLikeStatus, getLikedVisitas } from '../controllers/like.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// Ruta para dar/quitar like a una visita
router.post('/visitas/:visitaId/like', verifyToken, toggleLike);

// Ruta para obtener el estado del like de una visita
router.get('/visitas/:visitaId/like', verifyToken, getLikeStatus);

// Ruta para obtener todas las visitas que el usuario ha dado like
router.get('/likes', verifyToken, getLikedVisitas);

export default router; 