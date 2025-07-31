import { Visita, VisitaCompartida, User, Cafe, VisitaImagen, Amigos } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

// Función auxiliar para crear visita compartida con reintentos
const crearVisitaCompartidaConReintentos = async (req, res, maxReintentos = 3) => {
  for (let intento = 1; intento <= maxReintentos; intento++) {
    const t = await sequelize.transaction();

    try {
      console.log(`Intento ${intento} de crear visita compartida...`);
    const usuarioId = req.user.id;
    const { cafeteriaId, comentario, calificacion, maxParticipantes = 10 } = req.body;
    const imagenes = req.files;
    
    // Parsear amigosIds correctamente desde el FormData
    let amigosIds = req.body.amigosIds;
    if (Array.isArray(amigosIds)) {
      // Si ya es un array, convertir los strings a números
      amigosIds = amigosIds.map(id => parseInt(id));
    } else if (typeof amigosIds === 'string') {
      // Si es un string, convertirlo a array con un elemento
      amigosIds = [parseInt(amigosIds)];
    } else {
      // Si no existe, usar array vacío
      amigosIds = [];
    }

    console.log('Datos recibidos en crearVisitaCompartida:', {
      usuarioId,
      cafeteriaId,
      comentario,
      calificacion,
      amigosIds,
      maxParticipantes,
      imagenesCount: imagenes ? imagenes.length : 0
    });
    


    // Validar campos requeridos
    if (!cafeteriaId) {
      return res.status(400).json({
        mensaje: 'El ID de la cafetería es requerido'
      });
    }

    if (!comentario || comentario.trim().length === 0) {
      return res.status(400).json({
        mensaje: 'El comentario es requerido'
      });
    }

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({
        mensaje: 'La calificación debe estar entre 1 y 5'
      });
    }

    // Validar número máximo de participantes
    if (maxParticipantes < 1 || maxParticipantes > 10) {
      return res.status(400).json({
        mensaje: 'El número máximo de participantes debe estar entre 1 y 10'
      });
    }

    // Validar que se hayan enviado amigos
    if (!amigosIds || !Array.isArray(amigosIds) || amigosIds.length === 0) {
      return res.status(400).json({
        mensaje: 'Debes seleccionar al menos un amigo para compartir la visita'
      });
    }

    // Validar número máximo de amigos invitados
    if (amigosIds.length > maxParticipantes - 1) {
      return res.status(400).json({
        mensaje: `No puedes invitar más de ${maxParticipantes - 1} amigos (máximo ${maxParticipantes} participantes total)`
      });
    }

    // Verificar que la cafetería existe
    console.log('Buscando cafetería con ID:', cafeteriaId);
    const cafe = await Cafe.findByPk(cafeteriaId);
    if (!cafe) {
      console.log('Cafetería no encontrada con ID:', cafeteriaId);
      return res.status(404).json({
        mensaje: 'Cafetería no encontrada'
      });
    }
    console.log('Cafetería encontrada:', cafe.name);

    // Verificar que todos los amigos existen y son amigos aceptados
    console.log('Verificando amistades para usuarioId:', usuarioId, 'con amigosIds:', amigosIds);
    
    const amigos = await Amigos.findAll({
      where: {
        [Op.or]: [
          { userId: usuarioId, friendId: { [Op.in]: amigosIds }, status: 'accepted' },
          { userId: { [Op.in]: amigosIds }, friendId: usuarioId, status: 'accepted' }
        ]
      }
    });

    console.log('Amistades encontradas:', amigos.length, 'de', amigosIds.length, 'solicitadas');
    console.log('Amistades encontradas:', amigos.map(a => ({ userId: a.userId, friendId: a.friendId, status: a.status })));

    // Contar amistades únicas (evitar duplicados)
    const amigosUnicos = new Set();
    amigos.forEach(amigo => {
      if (amigo.userId === usuarioId) {
        amigosUnicos.add(amigo.friendId);
      } else {
        amigosUnicos.add(amigo.userId);
      }
    });

    console.log('Amistades únicas encontradas:', Array.from(amigosUnicos));
    console.log('Amigos solicitados:', amigosIds);

    // Verificar que todos los amigos solicitados están en las amistades únicas
    const todosSonAmigos = amigosIds.every(amigoId => amigosUnicos.has(amigoId));

    if (!todosSonAmigos) {
      console.log('Error: No se encontraron todas las amistades esperadas');
      return res.status(400).json({
        mensaje: 'Algunos usuarios no son tus amigos o la amistad no está confirmada'
      });
    }

    // Crear la visita compartida
    console.log('Creando visita compartida...');
    const nuevaVisita = await Visita.create({
      usuarioId,
      cafeteriaId,
      comentario,
      calificacion,
      fecha: new Date(),
      esCompartida: true,
      maxParticipantes
    }, { transaction: t });
    console.log('Visita creada con ID:', nuevaVisita.id);

    // Agregar el creador como participante
    console.log('Agregando creador como participante...');
    await VisitaCompartida.create({
      visitaId: nuevaVisita.id,
      usuarioId,
      rol: 'creador',
      estado: 'aceptada',
      fechaRespuesta: new Date()
    }, { transaction: t });

    // Invitar a los amigos
    console.log('Creando invitaciones para amigos...');
    const invitaciones = amigosIds.map(amigoId => ({
      visitaId: nuevaVisita.id,
      usuarioId: amigoId,
      rol: 'participante',
      estado: 'pendiente'
    }));

    await VisitaCompartida.bulkCreate(invitaciones, { transaction: t });
    console.log('Invitaciones creadas para', invitaciones.length, 'amigos');

    // Si hay imágenes, guardarlas
    if (imagenes && imagenes.length > 0) {
      console.log('Guardando', imagenes.length, 'imágenes...');
      const imagenesParaGuardar = imagenes.map((imagen, index) => ({
        visitaId: nuevaVisita.id,
        imageUrl: imagen.path,
        orden: index + 1
      }));

      await VisitaImagen.bulkCreate(imagenesParaGuardar, { transaction: t });
      console.log('Imágenes guardadas correctamente');
    } else {
      console.log('No hay imágenes para guardar');
    }

      console.log('Haciendo commit de la transacción...');
      await t.commit();
      console.log('Transacción completada exitosamente');

      // Obtener la visita completa con participantes
      const visitaCompleta = await Visita.findByPk(nuevaVisita.id, {
        include: [
          {
            model: VisitaImagen,
            as: 'visitaImagenes',
            attributes: ['imageUrl', 'orden']
          },
          {
            model: Cafe,
            as: 'cafeteria',
            attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'tags', 'openingHours']
          },
          {
            model: User,
            as: 'usuario',
            attributes: ['id', 'name', 'profileImage']
          },
          {
            model: VisitaCompartida,
            as: 'participantes',
            include: [
              {
                model: User,
                as: 'usuario',
                attributes: ['id', 'name', 'profileImage']
              }
            ]
          }
        ],
        order: [
          ['fecha', 'DESC'],
          [{ model: VisitaImagen, as: 'visitaImagenes' }, 'orden', 'ASC']
        ]
      });

      res.status(201).json({
        mensaje: 'Visita compartida creada exitosamente',
        visita: visitaCompleta
      });
      return; // Salir del bucle de reintentos

    } catch (error) {
      console.error(`Error en intento ${intento} al crear visita compartida:`, error);
      
      try {
        await t.rollback();
        console.log(`Transacción revertida correctamente en intento ${intento}`);
      } catch (rollbackError) {
        console.error('Error al revertir transacción:', rollbackError);
      }

      // Si es el último intento, devolver error
      if (intento === maxReintentos) {
        console.error('Se agotaron todos los intentos. Devolviendo error al cliente.');
        res.status(500).json({
          mensaje: 'Error al crear la visita compartida después de varios intentos',
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        return;
      }

      // Si es un deadlock, esperar un poco antes del siguiente intento
      if (error.name === 'SequelizeDatabaseError' && error.parent?.code === 'ER_LOCK_DEADLOCK') {
        console.log(`Deadlock detectado en intento ${intento}. Esperando antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * intento)); // Espera progresiva
      }
    }
  }
};

// Crear una visita compartida e invitar amigos
export const crearVisitaCompartida = async (req, res) => {
  return crearVisitaCompartidaConReintentos(req, res);
};

// Responder a una invitación de visita compartida
export const responderInvitacion = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const usuarioId = req.user.id;
    const { visitaId } = req.params;
    const { respuesta } = req.body; // 'aceptada' o 'rechazada'

    if (!['aceptada', 'rechazada'].includes(respuesta)) {
      return res.status(400).json({
        mensaje: 'La respuesta debe ser "aceptada" o "rechazada"'
      });
    }

    // Buscar la invitación
    const invitacion = await VisitaCompartida.findOne({
      where: {
        visitaId,
        usuarioId,
        estado: 'pendiente'
      },
      include: [
        {
          model: Visita,
          as: 'visita',
          include: [
            {
              model: VisitaCompartida,
              as: 'participantes'
            }
          ]
        }
      ]
    });

    if (!invitacion) {
      return res.status(404).json({
        mensaje: 'Invitación no encontrada o ya respondida'
      });
    }

    // Actualizar el estado de la invitación
    await invitacion.update({
      estado: respuesta,
      fechaRespuesta: new Date()
    }, { transaction: t });

    await t.commit();

    res.json({
      mensaje: `Invitación ${respuesta} exitosamente`,
      invitacion
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al responder invitación:', error);
    res.status(500).json({
      mensaje: 'Error al responder la invitación',
      error: error.message
    });
  }
};

// Obtener invitaciones pendientes del usuario
export const obtenerInvitacionesPendientes = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const invitaciones = await VisitaCompartida.findAll({
      where: {
        usuarioId,
        estado: 'pendiente'
      },
      include: [
        {
          model: Visita,
          as: 'visita',
          include: [
            {
              model: Cafe,
              as: 'cafeteria',
              attributes: ['id', 'name', 'address', 'imageUrl', 'rating']
            },
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            },
            {
              model: VisitaCompartida,
              as: 'participantes',
              include: [
                {
                  model: User,
                  as: 'usuario',
                  attributes: ['id', 'name', 'profileImage']
                }
              ]
            }
          ]
        }
      ],
      order: [['fechaInvitacion', 'DESC']]
    });

    res.json({
      mensaje: 'Invitaciones pendientes obtenidas exitosamente',
      totalInvitaciones: invitaciones.length,
      invitaciones
    });

  } catch (error) {
    console.error('Error al obtener invitaciones pendientes:', error);
    res.status(500).json({
      mensaje: 'Error al obtener las invitaciones pendientes',
      error: error.message
    });
  }
};

// Obtener visitas compartidas del usuario (como creador o participante)
export const obtenerVisitasCompartidas = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const visitasCompartidas = await VisitaCompartida.findAll({
      where: {
        usuarioId,
        estado: 'aceptada'
      },
      include: [
        {
          model: Visita,
          as: 'visita',
          where: { esCompartida: true },
          include: [
            {
              model: Cafe,
              as: 'cafeteria',
              attributes: ['id', 'name', 'address', 'imageUrl', 'rating']
            },
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            },
            {
              model: VisitaImagen,
              as: 'visitaImagenes',
              attributes: ['imageUrl', 'orden']
            },
            {
              model: VisitaCompartida,
              as: 'participantes',
              include: [
                {
                  model: User,
                  as: 'usuario',
                  attributes: ['id', 'name', 'profileImage']
                }
              ]
            }
          ]
        }
      ],
      order: [[{ model: Visita, as: 'visita' }, 'fecha', 'DESC']]
    });

    const visitasTransformadas = visitasCompartidas.map(participacion => ({
      ...participacion.toJSON(),
      visita: {
        ...participacion.visita.toJSON(),
        imagenes: participacion.visita.visitaImagenes || []
      }
    }));

    res.json({
      mensaje: 'Visitas compartidas obtenidas exitosamente',
      totalVisitas: visitasTransformadas.length,
      visitas: visitasTransformadas
    });

  } catch (error) {
    console.error('Error al obtener visitas compartidas:', error);
    res.status(500).json({
      mensaje: 'Error al obtener las visitas compartidas',
      error: error.message
    });
  }
};

// Obtener detalles de una visita compartida específica
export const obtenerVisitaCompartida = async (req, res) => {
  try {
    const { visitaId } = req.params;
    const usuarioId = req.user.id;

    // Verificar que el usuario es participante de la visita
    const participacion = await VisitaCompartida.findOne({
      where: {
        visitaId,
        usuarioId
      }
    });

    if (!participacion) {
      return res.status(403).json({
        mensaje: 'No tienes acceso a esta visita compartida'
      });
    }

    const visita = await Visita.findByPk(visitaId, {
      where: { esCompartida: true },
      include: [
        {
          model: Cafe,
          as: 'cafeteria',
          attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'tags', 'openingHours']
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: VisitaImagen,
          as: 'visitaImagenes',
          attributes: ['imageUrl', 'orden']
        },
        {
          model: VisitaCompartida,
          as: 'participantes',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        }
      ],
      order: [
        [{ model: VisitaImagen, as: 'visitaImagenes' }, 'orden', 'ASC']
      ]
    });

    if (!visita) {
      return res.status(404).json({
        mensaje: 'Visita compartida no encontrada'
      });
    }

    const visitaTransformada = {
      ...visita.toJSON(),
      imagenes: visita.visitaImagenes || []
    };

    res.json({
      mensaje: 'Visita compartida obtenida exitosamente',
      visita: visitaTransformada,
      miRol: participacion.rol,
      miEstado: participacion.estado
    });

  } catch (error) {
    console.error('Error al obtener visita compartida:', error);
    res.status(500).json({
      mensaje: 'Error al obtener la visita compartida',
      error: error.message
    });
  }
}; 