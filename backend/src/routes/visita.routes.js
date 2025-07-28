import express from 'express';
import { 
  crearVisita, 
  obtenerVisitas, 
  obtenerVisitaPorId,
  actualizarVisita,
  eliminarVisita,
  obtenerDiarioUsuario 
} from '../controllers/visita.controller.js';
import { upload } from '../config/cloudinary.js';
import multer from 'multer';

const router = express.Router();

// Configurar multer para manejar mejor el multipart/form-data
const uploadMiddleware = (req, res, next) => {
  // Configuración específica para multer
  const multerUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 5
    }
  }).array('imagenes', 5);

  // Aplicar multer primero
  multerUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Error de multer (tamaño, número de archivos, etc.)
      console.error('Error de Multer:', err);
      return res.status(400).json({
        mensaje: 'Error al procesar las imágenes',
        error: err.message
      });
    } else if (err) {
      // Otro tipo de error
      console.error('Error desconocido:', err);
      return res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: err.message
      });
    }

    // Si hay archivos, procesarlos con cloudinary
    if (req.files && req.files.length > 0) {
      upload.array('imagenes', 5)(req, res, (cloudinaryErr) => {
        if (cloudinaryErr) {
          console.error('Error de Cloudinary:', cloudinaryErr);
          return res.status(500).json({
            mensaje: 'Error al subir las imágenes a Cloudinary',
            error: cloudinaryErr.message
          });
        }
        next();
      });
    } else {
      // Si no hay archivos, continuar
      next();
    }
  });
};

// Rutas existentes
router.post('/visitas', uploadMiddleware, crearVisita);
router.get('/visitas', obtenerVisitas);
router.get('/visitas/:id', obtenerVisitaPorId);
router.put('/visitas/:id', uploadMiddleware, actualizarVisita);
router.delete('/visitas/:id', eliminarVisita);

// Ruta para el diario de un usuario
router.get('/usuarios/:usuarioId/diario', obtenerDiarioUsuario);

export default router;