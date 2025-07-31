import { Amigos, User } from '../models/index.js';
import { Op } from 'sequelize';

// Enviar solicitud de amistad
export const enviarSolicitud = async (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.body;

  if (userId === friendId) {
    return res.status(400).json({ error: 'No puedes enviarte una solicitud a ti mismo.' });
  }

  try {
    const existing = await Amigos.findOne({
      where: {
        [Op.or]: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({ error: 'Ya existe una solicitud o amistad entre estos usuarios.' });
    }

    const solicitud = await Amigos.create({
      userId,
      friendId,
      status: 'pending'
    });

    res.status(201).json({ message: 'Solicitud de amistad enviada.', solicitud });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar solicitud.' });
  }
};

// Responder solicitud (aceptar o rechazar)
export const responderSolicitud = async (req, res) => {
  const { solicitudId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }

  try {
    const solicitud = await Amigos.findByPk(solicitudId);

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    if (solicitud.friendId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para responder esta solicitud.' });
    }

    solicitud.status = status;
    await solicitud.save();

    if (status === 'accepted') {
      const inversa = await Amigos.findOne({
        where: {
          userId: solicitud.friendId,
          friendId: solicitud.userId
        }
      });

      if (!inversa) {
        await Amigos.create({
          userId: solicitud.friendId,
          friendId: solicitud.userId,
          status: 'accepted'
        });
      }
    } else if (status === 'rejected') {
      await solicitud.destroy();
      return res.json({ message: 'Solicitud rechazada y eliminada.' });
    }

    res.json({ message: `Solicitud ${status}.`, solicitud });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al responder solicitud.' });
  }
};

// Eliminar amistad
export const eliminarAmistad = async (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.body;

  try {
    const relaciones = await Amigos.findAll({
      where: {
        [Op.or]: [
          { userId, friendId, status: 'accepted' },
          { userId: friendId, friendId: userId, status: 'accepted' }
        ]
      }
    });

    if (relaciones.length === 0) {
      return res.status(404).json({ error: 'Amistad no encontrada.' });
    }

    const isInvolved = relaciones.some(
      rel => rel.userId === userId || rel.friendId === userId
    );

    if (!isInvolved) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta amistad.' });
    }

    await Promise.all(relaciones.map(r => r.destroy()));

    res.json({ message: 'Amistad eliminada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar amistad.' });
  }
};

// Obtener amigos
export const obtenerAmigos = async (req, res) => {
  const userId = req.user.id;

  try {
    const relaciones = await Amigos.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [
          { userId },
          { friendId: userId }
        ]
      }
    });

    const amigosIds = relaciones.map(rel =>
      rel.userId === userId ? rel.friendId : rel.userId
    );

    const amigos = await User.findAll({
      where: { id: amigosIds },
      attributes: ['id', 'name', 'email', 'avatar'] // 👈 incluye avatar
    });

    res.json(amigos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener amigos.' });
  }
};

// Solicitudes recibidas
export const solicitudesRecibidas = async (req, res) => {
  const userId = req.user.id;

  try {
    const solicitudes = await Amigos.findAll({
      where: {
        friendId: userId,
        status: 'pending'
      },
      include: [{ model: User, as: 'solicitante', attributes: ['id', 'name', 'email'] }]
    });

    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener solicitudes recibidas.' });
  }
};

// Solicitudes enviadas
export const solicitudesEnviadas = async (req, res) => {
  const userId = req.user.id;

  try {
    const solicitudes = await Amigos.findAll({
      where: {
        userId,
        status: 'pending'
      },
      include: [{ model: User, as: 'destinatario', attributes: ['id', 'name', 'email'] }]
    });

    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener solicitudes enviadas.' });
  }
};


//Cancelar la solicitud de amistad
export const cancelarSolicitudEnviada = async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const userId = req.user.id;

    // Verificar que la solicitud existe y pertenece al usuario
    const solicitud = await Amigos.findOne({  // <- Aquí estaba el error
      where: {
        id: solicitudId,
        userId: userId,
        status: 'pending'
      }
    });

    if (!solicitud) {
      return res.status(404).json({
        error: 'Solicitud no encontrada o no puedes cancelar esta solicitud'
      });
    }

    // Eliminar la solicitud
    await solicitud.destroy();

    res.json({
      message: 'Solicitud cancelada correctamente'
    });

  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};