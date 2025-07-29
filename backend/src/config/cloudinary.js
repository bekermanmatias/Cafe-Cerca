import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { unlink } from 'fs/promises';
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

// Configurar el almacenamiento para visitas
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

// Multer configurado para visitas
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por archivo
    files: 5 // Máximo 5 archivos
  }
});

/**
 * Sube un archivo a Cloudinary (para imágenes de perfil)
 * @param {string} filePath - Ruta del archivo temporal
 * @returns {Promise<Object>} - Respuesta de Cloudinary con la URL de la imagen
 */
export const uploadToCloudinary = async (filePath) => {
  try {
    // Subir el archivo a Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'cafe-cerca/profile-images', // Carpeta específica para imágenes de perfil
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }] // Optimizado para fotos de perfil
    });

    // Eliminar el archivo temporal
    await unlink(filePath);

    return {
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    // Si hay un error, intentar eliminar el archivo temporal
    try {
      await unlink(filePath);
    } catch (unlinkError) {
      console.error('Error eliminando archivo temporal:', unlinkError);
    }
    
    throw new Error(`Error al subir imagen a Cloudinary: ${error.message}`);
  }
};

// Función para eliminar imagen de Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
    throw error;
  }
};