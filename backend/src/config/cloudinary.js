import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Verificar que las variables de entorno estén configuradas
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Error: Faltan variables de entorno de Cloudinary:', missingEnvVars.join(', '));
  process.exit(1);
}

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar el almacenamiento
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cafecerca/visitas',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    format: 'jpg' // Forzar formato jpg para consistencia
  }
});

// Configurar multer con manejo de errores
const fileFilter = (req, file, cb) => {
  // Verificar el tipo de archivo
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Solo se permiten archivos de imagen'), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por archivo
    files: 5 // Máximo 5 archivos
  }
});

// Función para eliminar imagen de Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw error;
  }
};

export default cloudinary;