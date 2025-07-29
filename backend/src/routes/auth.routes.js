import express from 'express';
import { register, login, updateProfileImage } from '../controllers/auth.controller.js';
import multer from 'multer';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configuración de multer para manejar la subida de archivos
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('El archivo debe ser una imagen'));
    }
  }
});

// Rutas de autenticación
router.post('/register', upload.single('profileImage'), register);
router.post('/login', login);

// Ruta para actualizar la foto de perfil (requiere autenticación)
router.put('/profile-image', verifyToken, upload.single('profileImage'), updateProfileImage);

export default router;
