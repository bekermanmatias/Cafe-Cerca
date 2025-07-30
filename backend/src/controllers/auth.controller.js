import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const SECRET_KEY = process.env.JWT_SECRET || 'cafecercaclave';

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existente = await User.findOne({ where: { email } });
    if (existente) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: nuevoUsuario.id }, SECRET_KEY, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Usuario creado correctamente.',
      token,
      user: {
        id: nuevoUsuario.id,
        name: nuevoUsuario.name,
        email: nuevoUsuario.email
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
        avatar: usuario.avatar
      }
    });
  } catch (err) {
    console.error('❌ Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
};
