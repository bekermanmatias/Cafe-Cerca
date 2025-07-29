import { Router } from 'express';
import { toggleSavedCafe, getSavedStatus, getSavedCafes } from '../controllers/savedCafe.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// Ruta para guardar/quitar de guardados una cafetería
router.post('/cafes/:cafeId/save', verifyToken, toggleSavedCafe);

// Ruta para obtener el estado de guardado de una cafetería
router.get('/cafes/:cafeId/save', verifyToken, getSavedStatus);

// Ruta para obtener todas las cafeterías guardadas del usuario
router.get('/saved-cafes', verifyToken, getSavedCafes);

export default router; 