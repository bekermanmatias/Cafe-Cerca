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
      profileImage: profileImageUrl 
    });

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '7d' });
    
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
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const userId = req.user.id;
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
