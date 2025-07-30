import { Router } from 'express';
import { toggleLike, getLikeStatus, getLikedVisitas } from '../controllers/like.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// Ruta para obtener todas las visitas que el usuario ha dado like
router.get('/', verifyToken, getLikedVisitas);

// Ruta para dar/quitar like a una visita
router.post('/toggle/:visitaId', verifyToken, toggleLike);

// Ruta para obtener el estado del like de una visita
router.get('/status/:visitaId', verifyToken, getLikeStatus);

export default router; 