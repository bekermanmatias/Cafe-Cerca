import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { User } from '../models/index.js';

// GET /api/users/search?query=nombre
export const buscarUsuarios = async (req, res) => {
  const userId = parseInt(req.user?.id, 10);
  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'La búsqueda debe tener al menos 2 caracteres.' });
  }

  try {
    const usuarios = await User.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { name: { [Op.like]: `%${query}%` } },
              { email: { [Op.like]: `%${query}%` } }
            ]
          },
          { id: { [Op.ne]: userId } }
        ]
      },
      attributes: ['id', 'name', 'email', 'avatar']
    });

    res.json(usuarios);
  } catch (error) {
    console.error('❌ Error al buscar usuarios:', error);
    res.status(500).json({ error: 'Error al buscar usuarios.' });
  }
};

// GET /api/users/:id
export const obtenerUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'avatar']
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario.' });
  }
};

// PUT /api/users/:id
export const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(req.user?.id, 10);
  const { name, email, avatar } = req.body;

  if (parseInt(id, 10) !== userId) {
    return res.status(403).json({ error: 'No tienes permiso para modificar este usuario.' });
  }

  try {
    const usuario = await User.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (email && email !== usuario.email) {
      const existeEmail = await User.findOne({ where: { email } });
      if (existeEmail) return res.status(400).json({ error: 'Email ya en uso.' });
      usuario.email = email;
    }

    if (name) usuario.name = name;
    if (avatar) usuario.avatar = avatar;

    await usuario.save();

    res.json({
      message: 'Usuario actualizado correctamente.',
      usuario: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        avatar: usuario.avatar
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
};

// PUT /api/users/:id/password
export const cambiarContrasena = async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(req.user?.id, 10);
  const { currentPassword, newPassword } = req.body;

  if (parseInt(id, 10) !== userId) {
    return res.status(403).json({ error: 'No tienes permiso para cambiar esta contraseña.' });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Debes enviar la contraseña actual y la nueva.' });
  }

  try {
    const usuario = await User.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const valid = await bcrypt.compare(currentPassword, usuario.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });

    const hash = await bcrypt.hash(newPassword, 10);
    usuario.password = hash;

    await usuario.save();

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña.' });
  }
};

// DELETE /api/users/:id
export const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(req.user?.id, 10);

  if (parseInt(id, 10) !== userId) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar este usuario.' });
  }

  try {
    const usuario = await User.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    await usuario.destroy();

    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
};
