// routes/etiquetas.js
import express from 'express';
import { etiquetasController } from '../controllers/etiquetasController.js';

const router = express.Router();

// GET /api/etiquetas - Obtener todas las etiquetas
router.get('/', etiquetasController.getAll);

// GET /api/etiquetas/:id - Obtener etiqueta por ID
router.get('/:id', etiquetasController.getById);

// POST /api/etiquetas - Crear nueva etiqueta
router.post('/', etiquetasController.create);

// PUT /api/etiquetas/:id - Actualizar etiqueta
router.put('/:id', etiquetasController.update);

// DELETE /api/etiquetas/:id - Desactivar etiqueta
router.delete('/:id', etiquetasController.delete);

// PUT /api/etiquetas/:id/restaurar - Reactivar etiqueta
router.put('/:id/restaurar', etiquetasController.restaurar);

export default router;

// En tu archivo principal (app.js o server.js), agregar:
/*
import etiquetasRoutes from './routes/etiquetas.js';

// Después de tus otras rutas:
app.use('/api/etiquetas', etiquetasRoutes);
*/