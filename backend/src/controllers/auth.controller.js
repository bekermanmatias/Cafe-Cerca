import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const SECRET = process.env.JWT_SECRET || 'supersecreto';

export const register = async (req, res) => {
  const { email, password, name } = req.body;
  let profileImageUrl = null;

  try {
    // Validaciones
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
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

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      email, 
      password: hash, 
      name,
      profileImage: profileImageUrl 
    });
    
    res.status(201).json({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      profileImage: user.profileImage
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: 'El correo y la contraseña son requeridos' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1d' });
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        profileImage: user.profileImage
      } 
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Nueva función para actualizar la foto de perfil
export const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const userId = req.user.id; // Asumiendo que tienes middleware de autenticación
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Subir nueva imagen a Cloudinary
    const result = await uploadToCloudinary(req.file.path);
    
    // Actualizar el usuario con la nueva URL de la imagen
    await user.update({ profileImage: result.secure_url });

    res.json({ 
      message: 'Imagen de perfil actualizada exitosamente',
      profileImage: result.secure_url 
    });
  } catch (error) {
    console.error('Error al actualizar imagen de perfil:', error);
    res.status(500).json({ error: 'Error al actualizar la imagen de perfil' });
  }
};
