import express from 'express';
import { crearVisita, obtenerVisitas, obtenerVisitaPorId, actualizarVisita, eliminarVisita, obtenerDiarioUsuario } from '../controllers/visita.controller.js';
import { upload } from '../config/cloudinary.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas protegidas que requieren autenticación
router.post('/', verifyToken, upload.array('imagenes', 5), crearVisita);
router.put('/:id', verifyToken, upload.array('imagenes', 5), actualizarVisita);
router.delete('/:id', verifyToken, eliminarVisita);
router.get('/usuario/:usuarioId', verifyToken, obtenerDiarioUsuario);

// Rutas públicas
router.get('/', obtenerVisitas);
router.get('/:id', obtenerVisitaPorId);

export default router;