import { Router } from 'express';
import { toggleSavedCafe, getSavedStatus, getSavedCafes } from '../controllers/savedCafe.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// Ruta para guardar/quitar de guardados una cafetería
router.post('/toggle/:cafeId', verifyToken, toggleSavedCafe);

// Ruta para obtener el estado de guardado de una cafetería
router.get('/status/:cafeId', verifyToken, getSavedStatus);

// Ruta para obtener todas las cafeterías guardadas del usuario
router.get('/', verifyToken, getSavedCafes);

export default router; 