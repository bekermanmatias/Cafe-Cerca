import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const SECRET_KEY = process.env.JWT_SECRET || 'cafecercaclave';

export const register = async (req, res) => {
  const { email, password, name } = req.body;
  let profileImageUrl = null;

  try {
    const existente = await User.findOne({ where: { email } });
    if (existente) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    // Si hay una imagen de perfil, subirla a Cloudinary
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path);
        profileImageUrl = result.secure_url;
      } catch (error) {
        console.error('Error al subir imagen a Cloudinary:', error);
        return res.status(500).json({ error: 'Error al procesar la imagen de perfil' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      email, 
      password: hashedPassword, 
      name,
      profileImage: profileImageUrl || undefined // Si es null, usará el defaultValue del modelo
    });

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '7d' });
    
    console.log('Usuario creado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage
    });
    
    res.status(201).json({ 
      message: 'Usuario creado correctamente.',
      token,
      user: {
        id: user.id, 
        email: user.email, 
        name: user.name,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    console.error('❌ Error al registrar:', err);
    res.status(500).json({ error: 'Error al registrar.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await User.findOne({ where: { email } });
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const token = jwt.sign({ id: usuario.id }, SECRET_KEY, { expiresIn: '7d' });

    res.json({
      message: 'Login exitoso.',
      token,
      user: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        profileImage: usuario.profileImage
      }
    });
  } catch (err) {
    console.error('❌ Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
};

export const updateProfileImage = async (req, res) => {
  console.log('🖼️ Iniciando actualización de imagen de perfil');
  console.log('🖼️ Usuario ID:', req.user?.id);
  console.log('🖼️ Archivo recibido:', req.file ? 'Sí' : 'No');
  
  try {
    if (!req.file) {
      console.log('❌ No se proporcionó archivo');
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    console.log('🖼️ Archivo recibido:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      console.log('❌ Usuario no encontrado:', userId);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('🖼️ Usuario encontrado:', user.name);

    // Subir nueva imagen a Cloudinary
    console.log('🖼️ Subiendo imagen a Cloudinary...');
    const result = await uploadToCloudinary(req.file.path);
    console.log('🖼️ Imagen subida a Cloudinary:', result.secure_url);
    
    // Actualizar el usuario con la nueva URL de la imagen
    await user.update({ profileImage: result.secure_url });
    console.log('🖼️ Usuario actualizado con nueva imagen');

    res.json({ 
      message: 'Imagen de perfil actualizada exitosamente',
      profileImage: result.secure_url 
    });
  } catch (error) {
    console.error('❌ Error al actualizar imagen de perfil:', error);
    res.status(500).json({ error: 'Error al actualizar la imagen de perfil' });
  }
};
