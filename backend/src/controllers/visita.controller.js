import { Visita, Cafe, User, VisitaImagen, Like, VisitaParticipante, Resena, Etiqueta } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

// Función helper para incluir las imágenes en las consultas
const includeImagenes = {
  model: VisitaImagen,
  as: 'visitaImagenes',
  attributes: ['imageUrl', 'orden']
};

// Función helper para incluir la cafetería
const includeCafeteria = {
  model: Cafe,
  as: 'cafeteria',
  attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'openingHours'],
  include: [{
    model: Etiqueta,
    as: 'etiquetas',
    attributes: ['nombre', 'icono'],
    through: { attributes: [] }
  }]
}


// Función helper para incluir el creador de la visita
const includeCreador = {
  model: VisitaParticipante,
  as: 'participantes',
  where: { rol: 'creador' },
  include: [
    {
      model: User,
      as: 'usuario',
      attributes: ['id', 'name', 'profileImage']
    }
  ]
};

// Función helper para incluir participantes
const includeParticipantes = {
  model: VisitaParticipante,
  as: 'participantes',
  include: [
    {
      model: User,
      as: 'usuario',
      attributes: ['id', 'name', 'profileImage']
    }
  ]
};

// Función helper para incluir reseñas
const includeResenas = {
  model: Resena,
  as: 'resenas',
  include: [
    {
      model: User,
      as: 'usuario',
      attributes: ['id', 'name', 'profileImage']
    }
  ]
};

// Función helper para ordenar las imágenes
const orderOptions = [
  ['fecha', 'DESC'],
  [{ model: VisitaImagen, as: 'visitaImagenes' }, 'orden', 'ASC']
];

export const crearVisita = async (req, res) => {
  let t;

  try {
    t = await sequelize.transaction();

    // Usar el ID del usuario del token de autenticación
    const usuarioId = req.user.id;
    const { 
      cafeteriaId, 
      esCompartida: esCompartidaRaw = false, 
      maxParticipantes = 10, 
      participantes = [],
      amigosIds = [], // Compatibilidad con frontend
      calificacion, // Para crear reseña automáticamente
      comentario // Para crear reseña automáticamente
    } = req.body;

    // Normalizar esCompartida a boolean
    const esCompartida = esCompartidaRaw === 'true' || esCompartidaRaw === true;
    const imagenes = req.files; // Múltiples archivos



    // Validar número máximo de imágenes
    if (imagenes && imagenes.length > 5) {
      return res.status(400).json({
        mensaje: 'No se pueden subir más de 5 imágenes por visita'
      });
    }

    // Verificar que la cafetería existe
    const cafe = await Cafe.findByPk(cafeteriaId);
    if (!cafe) {
      return res.status(404).json({
        mensaje: 'Cafetería no encontrada'
      });
    }

    // Crear la visita
    const nuevaVisita = await Visita.create({
      cafeteriaId,
      usuarioId, // Agregar el ID del usuario creador
      esCompartida,
      maxParticipantes,
      fecha: new Date(),
      estado: 'activa'
    }, { transaction: t });



    // Siempre agregar al creador como participante
    const creadorParticipante = await VisitaParticipante.create({
      visitaId: nuevaVisita.id,
      usuarioId,
      rol: 'creador',
      estado: 'aceptada',
      fechaInvitacion: new Date(),
      fechaRespuesta: new Date()
    }, { transaction: t });



    // Asegurar que amigosIds sea siempre un array
    const amigosIdsArray = Array.isArray(amigosIds) ? amigosIds : [amigosIds].filter(id => id);
    
    // Si es una visita compartida y hay participantes, agregarlos
    const participantesFinales = participantes.length > 0 ? participantes : amigosIdsArray;
    
    if (esCompartida && participantesFinales.length > 0) {
      const participantesParaGuardar = participantesFinales.map(participanteId => ({
        visitaId: nuevaVisita.id,
        usuarioId: participanteId,
        rol: 'participante',
        estado: 'pendiente',
        fechaInvitacion: new Date()
      }));

      await VisitaParticipante.bulkCreate(participantesParaGuardar, { transaction: t });
    }

    // Si hay imágenes, guardarlas
    if (imagenes && imagenes.length > 0) {
      const imagenesParaGuardar = imagenes.map((imagen, index) => ({
        visitaId: nuevaVisita.id,
        imageUrl: imagen.path,
        orden: index + 1
      }));

      await VisitaImagen.bulkCreate(imagenesParaGuardar, { transaction: t });
    }

        // Si se proporcionan calificación y comentario, crear una reseña automáticamente
    if (calificacion && comentario) {
      await Resena.create({
        visitaId: nuevaVisita.id,
        usuarioId,
        calificacion,
        comentario
      }, { transaction: t });
    }

    // Obtener la visita completa con todas las relaciones (dentro de la transacción)
    const visitaCompleta = await Visita.findOne({
      where: { id: nuevaVisita.id },
      include: [
        {
  model: Cafe,
  as: 'cafeteria',
  attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'openingHours'],
  include: [
    {
      model: Etiqueta,
      as: 'etiquetas',
      attributes: ['id', 'nombre', 'icono'],
      through: { attributes: [] } // para no traer datos de la tabla intermedia
    }
  ]
},
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: VisitaParticipante,
          as: 'participantes',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        },
        {
          model: Resena,
          as: 'resenas',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ],
          required: false
        },
        {
          model: VisitaImagen,
          as: 'visitaImagenes',
          attributes: ['imageUrl', 'orden']
        },
        {
          model: Like,
          as: 'likes'
        }
      ],
      raw: false,
      nest: true,
      transaction: t // Importante: incluir la transacción aquí también
    });

    if (!visitaCompleta) {
      throw new Error('Error al obtener la visita creada');
    }

    // Transformar la respuesta
    const visitaJSON = visitaCompleta.toJSON();

    console.log('🔍 DEBUG - Datos de la visita:', {
      id: visitaJSON.id,
      usuario: visitaJSON.usuario,
      resenas: visitaJSON.resenas?.map(r => ({
        id: r.id,
        usuarioId: r.usuarioId,
        calificacion: r.calificacion,
        comentario: r.comentario
      }))
    });

    // Asegurarnos de que tenemos la información del creador
    const creador = visitaJSON.usuario;
    const resenaCreador = visitaJSON.resenas?.find(r => r.usuarioId === creador.id);

    if (!creador) {
      console.error('❌ No se encontró el creador de la visita:', {
        visitaId: visitaJSON.id,
        usuarioId: visitaJSON.usuarioId
      });
      throw new Error('No se encontró el creador de la visita');
    }

    if (!resenaCreador) {
      console.error('❌ No se encontró la reseña del creador:', {
        visitaId: visitaJSON.id,
        usuarioId: visitaJSON.usuarioId,
        resenas: visitaJSON.resenas?.map(r => ({
          id: r.id,
          usuarioId: r.usuarioId,
          comentario: r.comentario
        }))
      });
      throw new Error('No se encontró la reseña del creador');
    }

    console.log('✅ Creador y reseña encontrados:', {
      creador: {
        id: creador.id,
        name: creador.name
      },
      resena: {
        id: resenaCreador.id,
        calificacion: resenaCreador.calificacion
      }
    });

    const visitaTransformada = {
      id: visitaJSON.id,
      fecha: visitaJSON.fecha,
      estado: visitaJSON.estado,
      esCompartida: visitaJSON.esCompartida,
      cafeteria: visitaJSON.cafeteria,
      imagenes: visitaJSON.visitaImagenes || [],
      likesCount: 0,
      creador: {
        id: creador.id,
        name: creador.name,
        profileImage: creador.profileImage,
        resena: {
          id: resenaCreador.id,
          calificacion: resenaCreador.calificacion,
          comentario: resenaCreador.comentario,
          fecha: resenaCreador.createdAt,
          usuario: {
            id: creador.id,
            name: creador.name,
            profileImage: creador.profileImage
          }
        }
      },
      participantes: (visitaJSON.participantes || [])
        .filter(p => p.rol !== 'creador')
        .map(p => ({
          id: p.usuario.id,
          name: p.usuario.name,
          profileImage: p.usuario.profileImage,
          estado: p.estado,
          rol: p.rol,
          fechaRespuesta: p.fechaRespuesta,
          resena: visitaJSON.resenas?.find(r => r.usuarioId === p.usuarioId) ? {
            id: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).id,
            calificacion: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).calificacion,
            comentario: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).comentario,
            fecha: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).createdAt,
            usuario: p.usuario
          } : null
        })) || []
    };

    // Si todo salió bien, confirmar la transacción
    await t.commit();

    res.status(201).json({
      mensaje: 'Visita creada exitosamente',
      visita: visitaTransformada
    });

  } catch (error) {
    if (t) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Error al hacer rollback:', rollbackError);
      }
    }
    console.error('💥 ERROR COMPLETO al crear visita:', error);
    console.error('💥 ERROR STACK:', error.stack);
    res.status(500).json({
      mensaje: 'Error al crear la visita',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const obtenerVisitas = async (req, res) => {
  try {
    const visitas = await Visita.findAll({
      include: [
{
      model: Cafe,
      as: 'cafeteria',
      attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'openingHours'],
      include: [
        {
          model: Etiqueta,
          as: 'etiquetas',
          attributes: ['id', 'nombre', 'icono'],
          through: { attributes: [] }  // para no traer datos del join table
        }
      ]
    },
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: VisitaParticipante,
          as: 'participantes',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        },
        {
          model: Resena,
          as: 'resenas',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ],
          required: false
        },
        {
          model: VisitaImagen,
          as: 'visitaImagenes',
          attributes: ['imageUrl', 'orden']
        },
        {
          model: Like,
          as: 'likes'
        }
      ],
      order: [['fecha', 'DESC']],
      raw: false,
      nest: true
    });

    const visitasTransformadas = visitas.map(visita => {
      const visitaJSON = visita.toJSON();
      const creador = visitaJSON.usuario;
      const resenaCreador = visitaJSON.resenas?.find(r => r.usuarioId === creador?.id);

      console.log('🔍 TRANSFORMANDO VISITA:', {
        id: visitaJSON.id,
        creador: creador ? { id: creador.id, name: creador.name, profileImage: creador.profileImage } : 'NULL',
        participantes: visitaJSON.participantes?.length || 0,
        resenas: visitaJSON.resenas?.length || 0
      });

      return {
        id: visitaJSON.id,
        fecha: visitaJSON.fecha,
        estado: visitaJSON.estado,
        esCompartida: visitaJSON.esCompartida,
        cafeteria: visitaJSON.cafeteria,
        imagenes: visitaJSON.visitaImagenes || [],
        likesCount: visitaJSON.likes?.length || 0,
        // Nueva estructura
        creador: creador ? {
          id: creador.id,
          name: creador.name,
          profileImage: creador.profileImage,
          resena: resenaCreador ? {
            id: resenaCreador.id,
            calificacion: resenaCreador.calificacion,
            comentario: resenaCreador.comentario,
            fecha: resenaCreador.createdAt,
            usuario: {
              id: creador.id,
              name: creador.name,
              profileImage: creador.profileImage
            }
          } : null
        } : null,
        participantes: (visitaJSON.participantes || [])
          .filter(p => p.rol !== 'creador')
          .map(p => ({
            id: p.usuario.id,
            name: p.usuario.name,
            profileImage: p.usuario.profileImage,
            estado: p.estado,
            rol: p.rol,
            fechaRespuesta: p.fechaRespuesta,
            resena: visitaJSON.resenas?.find(r => r.usuarioId === p.usuarioId) ? {
              id: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).id,
              calificacion: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).calificacion,
              comentario: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).comentario,
              fecha: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).createdAt,
              usuario: {
                id: p.usuario.id,
                name: p.usuario.name,
                profileImage: p.usuario.profileImage
              }
            } : null
          })),
        // Compatibilidad con estructura antigua
        usuario: creador,
        comentario: resenaCreador?.comentario,
        calificacion: resenaCreador?.calificacion
      };
    });

    console.log('📤 ENVIANDO VISITAS:', visitasTransformadas.map(v => ({
      id: v.id,
      creador: v.creador ? { id: v.creador.id, name: v.creador.name } : 'NULL',
      participantes: v.participantes?.length || 0
    })));

    res.json({
      mensaje: 'Visitas recuperadas exitosamente',
      totalVisitas: visitas.length,
      visitas: visitasTransformadas
    });
  } catch (error) {
    console.error('Error al obtener visitas:', error);
    res.status(500).json({
      mensaje: 'Error al obtener las visitas',
      error: error.message
    });
  }
};

export const obtenerVisitaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const visita = await Visita.findOne({
      where: { id },
      include: [
        {
  model: Cafe,
  as: 'cafeteria',
  attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'openingHours'],
  include: [
    {
      model: Etiqueta,
      as: 'etiquetas',
      attributes: ['id', 'nombre', 'icono'],
      through: { attributes: [] } // evita traer datos de la tabla intermedia
    }
  ]
},
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: VisitaParticipante,
          as: 'participantes',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        },
        {
          model: Resena,
          as: 'resenas',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ],
          required: false
        },
        {
          model: VisitaImagen,
          as: 'visitaImagenes',
          attributes: ['imageUrl', 'orden']
        },
        {
          model: Like,
          as: 'likes'
        }
      ],
      raw: false,
      nest: true
    });

    if (!visita) {
      return res.status(404).json({ mensaje: 'Visita no encontrada' });
    }

    // Transformar los datos para la respuesta
    const visitaJSON = visita.toJSON();

    console.log('🔍 DEBUG - Datos de la visita:', {
      id: visitaJSON.id,
      usuario: visitaJSON.usuario,
      participantes: visitaJSON.participantes?.map(p => ({
        id: p.usuario.id,
        name: p.usuario.name,
        rol: p.rol
      })),
      resenas: visitaJSON.resenas?.map(r => ({
        id: r.id,
        usuarioId: r.usuarioId,
        calificacion: r.calificacion,
        comentario: r.comentario
      }))
    });

    // Asegurarnos de que tenemos la información del creador
    const creador = visitaJSON.usuario;
    const resenaCreador = visitaJSON.resenas?.find(r => r.usuarioId === creador.id);

    if (!creador) {
      console.error('❌ No se encontró el creador de la visita:', {
        visitaId: visitaJSON.id,
        usuarioId: visitaJSON.usuarioId
      });
      throw new Error('No se encontró el creador de la visita');
    }

    if (!resenaCreador) {
      console.error('❌ No se encontró la reseña del creador:', {
        visitaId: visitaJSON.id,
        usuarioId: visitaJSON.usuarioId,
        resenas: visitaJSON.resenas?.map(r => ({
          id: r.id,
          usuarioId: r.usuarioId,
          comentario: r.comentario
        }))
      });
      throw new Error('No se encontró la reseña del creador');
    }

    console.log('✅ Creador y reseña encontrados:', {
      creador: {
        id: creador.id,
        name: creador.name
      },
      resena: {
        id: resenaCreador.id,
        calificacion: resenaCreador.calificacion
      }
    });

    // Construir la respuesta final
    const visitaTransformada = {
      id: visitaJSON.id,
      fecha: visitaJSON.fecha,
      estado: visitaJSON.estado,
      esCompartida: visitaJSON.esCompartida,
      cafeteria: visitaJSON.cafeteria,
      imagenes: visitaJSON.visitaImagenes || [],
      likesCount: visitaJSON.likes?.length || 0,
      creador: {
        id: creador.id,
        name: creador.name,
        profileImage: creador.profileImage,
        resena: {
          id: resenaCreador.id,
          calificacion: resenaCreador.calificacion,
          comentario: resenaCreador.comentario,
          fecha: resenaCreador.createdAt,
          usuario: {
            id: creador.id,
            name: creador.name,
            profileImage: creador.profileImage
          }
        }
      },
      participantes: (visitaJSON.participantes || [])
        .filter(p => p.rol !== 'creador')
        .map(p => ({
          id: p.usuario.id,
          name: p.usuario.name,
          profileImage: p.usuario.profileImage,
          estado: p.estado,
          rol: p.rol,
          fechaRespuesta: p.fechaRespuesta,
          resena: visitaJSON.resenas?.find(r => r.usuarioId === p.usuarioId) ? {
            id: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).id,
            calificacion: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).calificacion,
            comentario: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).comentario,
            fecha: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).createdAt,
            usuario: {
              id: p.usuario.id,
              name: p.usuario.name,
              profileImage: p.usuario.profileImage
            }
          } : null
        }))
    };

    console.log('📤 ENVIANDO RESPUESTA:', JSON.stringify({
      mensaje: 'Visita encontrada',
      visita: {
        id: visitaTransformada.id,
        creador: visitaTransformada.creador ? {
          id: visitaTransformada.creador.id,
          name: visitaTransformada.creador.name,
          resena: visitaTransformada.creador.resena ? 'SI' : 'NO'
        } : 'NULL'
      }
    }, null, 2));

    res.json({ mensaje: 'Visita encontrada', visita: visitaTransformada });
  } catch (error) {
    console.error('Error al obtener visita:', error);
    res.status(500).json({ mensaje: 'Error al obtener la visita' });
  }
};

export const actualizarVisita = async (req, res) => {
  console.log('🚀 DEBUG - Iniciando actualizarVisita');
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    console.log('🔍 DEBUG - ID de visita:', id);
    const { 
      cafeteriaId, 
      imagenesExistentes,
      calificacion,
      comentario,
      esCompartida,
      maxParticipantes,
      participantes = []
    } = req.body;
    const imagenes = req.files;

    console.log('🔍 DEBUG - Datos recibidos en actualizarVisita:', {
      id,
      cafeteriaId,
      imagenesExistentes,
      calificacion,
      comentario,
      esCompartida,
      maxParticipantes,
      participantes,
      'Número de imágenes nuevas': imagenes?.length || 0
    });

    console.log('🔍 DEBUG - Buscando visita con ID:', id);
    // Verificar si la visita existe
    const visita = await Visita.findByPk(id, {
      include: [
        includeImagenes,
        {
          model: VisitaParticipante,
          as: 'participantes',
          where: { rol: 'creador' },
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        }
      ]
    });

    if (!visita) {
      console.log('❌ DEBUG - Visita no encontrada:', id);
      return res.status(404).json({ mensaje: 'Visita no encontrada' });
    }
    console.log('✅ DEBUG - Visita encontrada:', visita.id);

    // Actualizar datos básicos de la visita
    const updateData = {};
    if (cafeteriaId) updateData.cafeteriaId = cafeteriaId;
    
    // Manejar esCompartida como booleano
    if (esCompartida !== undefined) {
      // Convertir a booleano si es string
      const esCompartidaBool = typeof esCompartida === 'string' 
        ? esCompartida === 'true' 
        : Boolean(esCompartida);
      updateData.esCompartida = esCompartidaBool;
      console.log('🔍 DEBUG - esCompartida convertida:', esCompartidaBool);
    }
    
    // Manejar maxParticipantes como número
    if (maxParticipantes) {
      const maxParticipantesNum = parseInt(maxParticipantes);
      if (!isNaN(maxParticipantesNum)) {
        updateData.maxParticipantes = maxParticipantesNum;
        console.log('🔍 DEBUG - maxParticipantes convertido:', maxParticipantesNum);
      }
    }

    console.log('🔍 DEBUG - Datos a actualizar:', updateData);

    if (Object.keys(updateData).length > 0) {
      console.log('🔍 DEBUG - Actualizando datos básicos de la visita');
      await visita.update(updateData, { transaction: t });
      console.log('✅ DEBUG - Datos básicos actualizados');
    }

    // Actualizar o crear reseña del creador
    if (calificacion && comentario) {
      console.log('🔍 DEBUG - Actualizando reseña del creador');
      const creadorParticipante = visita.participantes.find(p => p.rol === 'creador');
      if (creadorParticipante) {
        console.log('🔍 DEBUG - Creador encontrado:', creadorParticipante.usuarioId);
        const [resena, created] = await Resena.findOrCreate({
          where: {
            visitaId: id,
            usuarioId: creadorParticipante.usuarioId
          },
          defaults: {
            visitaId: id,
            usuarioId: creadorParticipante.usuarioId,
            calificacion: parseInt(calificacion),
            comentario: comentario
          },
          transaction: t
        });

        if (!created) {
          console.log('🔍 DEBUG - Actualizando reseña existente');
          await resena.update({
            calificacion: parseInt(calificacion),
            comentario: comentario
          }, { transaction: t });
        } else {
          console.log('✅ DEBUG - Reseña creada exitosamente');
        }
        console.log('✅ DEBUG - Reseña actualizada/creada');
      } else {
        console.log('❌ DEBUG - No se encontró el creador');
      }
    }

    // Manejar participantes (amigos)
    let participantesArray = [];
    console.log('🔍 DEBUG - Participantes recibidos:', participantes);
    
    if (participantes) {
      try {
        // Si es un string JSON, parsearlo
        if (typeof participantes === 'string') {
          participantesArray = JSON.parse(participantes);
          console.log('🔍 DEBUG - Participantes parseados:', participantesArray);
        } else {
          participantesArray = participantes;
          console.log('🔍 DEBUG - Participantes ya son array:', participantesArray);
        }
      } catch (error) {
        console.error('❌ Error al parsear participantes:', error);
        participantesArray = [];
      }
    }

    if (participantesArray && participantesArray.length > 0) {
      console.log('🔍 DEBUG - Eliminando participantes existentes para visita:', id);
      // Eliminar participantes existentes que no sean el creador
      await VisitaParticipante.destroy({
        where: {
          visitaId: id,
          rol: 'participante'
        },
        transaction: t
      });

      // Agregar nuevos participantes
      const participantesParaGuardar = participantesArray.map(participanteId => ({
        visitaId: id,
        usuarioId: participanteId,
        rol: 'participante',
        estado: 'pendiente',
        fechaInvitacion: new Date()
      }));

      console.log('🔍 DEBUG - Agregando nuevos participantes:', participantesParaGuardar);
      await VisitaParticipante.bulkCreate(participantesParaGuardar, { transaction: t });
    } else if (participantesArray && participantesArray.length === 0) {
      console.log('🔍 DEBUG - Eliminando todos los participantes (array vacío)');
      // Si se envía un array vacío, eliminar todos los participantes excepto el creador
      await VisitaParticipante.destroy({
        where: {
          visitaId: id,
          rol: 'participante'
        },
        transaction: t
      });
    }

    // Procesar las imágenes existentes
    console.log('🔍 DEBUG - Procesando imágenes');
    let imagenesExistentesArray = [];
    try {
      imagenesExistentesArray = imagenesExistentes ? JSON.parse(imagenesExistentes) : [];
      console.log('🔍 DEBUG - Imágenes existentes parseadas:', imagenesExistentesArray);
    } catch (error) {
      console.error('❌ DEBUG - Error al parsear imagenesExistentes:', error);
      imagenesExistentesArray = [];
    }

    // Si hay imágenes existentes, eliminar las que no están en la lista
    if (imagenesExistentesArray.length > 0) {
      console.log('Eliminando imágenes no incluidas en:', imagenesExistentesArray);
      await VisitaImagen.destroy({
        where: {
          visitaId: id,
          imageUrl: {
            [Op.notIn]: imagenesExistentesArray
          }
        },
        transaction: t
      });
    } else {
      console.log('No hay imágenes existentes, eliminando todas las imágenes anteriores');
      // Si no hay imágenes existentes, eliminar todas las imágenes anteriores
      await VisitaImagen.destroy({
        where: { visitaId: id },
        transaction: t
      });
    }

    // Si hay nuevas imágenes, agregarlas
    if (imagenes && imagenes.length > 0) {
      console.log('🔍 DEBUG - Guardando nuevas imágenes');
      const imagenesParaGuardar = imagenes.map((imagen, index) => ({
        visitaId: id,
        imageUrl: imagen.path,
        orden: imagenesExistentesArray.length + index + 1
      }));

      console.log('🔍 DEBUG - Imágenes para guardar:', imagenesParaGuardar);
      await VisitaImagen.bulkCreate(imagenesParaGuardar, { transaction: t });
      console.log('✅ DEBUG - Nuevas imágenes guardadas');
    }

    console.log('✅ DEBUG - Commit de transacción exitoso');
    await t.commit();

    // Obtener la visita actualizada con todos sus datos
    console.log('🔍 DEBUG - Obteniendo visita actualizada');
    const visitaActualizada = await Visita.findByPk(id, {
      include: [
        includeImagenes,
        includeCafeteria,
        {
          model: VisitaParticipante,
          as: 'participantes',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        },
        {
          model: Resena,
          as: 'resenas',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        }
      ],
      order: orderOptions
    });

        console.log('✅ DEBUG - Visita actualizada obtenida exitosamente');
    res.json({
      mensaje: 'Visita actualizada exitosamente',
      visita: visitaActualizada
    });

  } catch (error) {
    console.error('❌ DEBUG - Error en actualizarVisita:', error);
    console.error('❌ DEBUG - Stack trace:', error.stack);
    
    // Solo hacer rollback si la transacción no ha sido finalizada
    try {
      await t.rollback();
    } catch (rollbackError) {
      console.error('❌ DEBUG - Error en rollback:', rollbackError);
    }
    
    console.error('Error al actualizar visita:', error);
    res.status(500).json({
      mensaje: 'Error al actualizar la visita',
      error: error.message,
      stack: error.stack
    });
  }
};

export const eliminarVisita = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Verificar si la visita existe y obtener sus datos
    const visita = await Visita.findByPk(id, {
      include: [
        includeImagenes,
        {
          model: VisitaParticipante,
          as: 'participantes',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        },
        {
          model: Resena,
          as: 'resenas',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        }
      ]
    });

    if (!visita) {
      return res.status(404).json({ mensaje: 'Visita no encontrada' });
    }

    // Guardar información de la visita antes de eliminarla
    const visitaEliminada = { ...visita.toJSON() };

    // Eliminar las reseñas asociadas
    await Resena.destroy({
      where: { visitaId: id },
      transaction: t
    });

    // Eliminar los participantes asociados
    await VisitaParticipante.destroy({
      where: { visitaId: id },
      transaction: t
    });

    // Eliminar las imágenes asociadas
    await VisitaImagen.destroy({
      where: { visitaId: id },
      transaction: t
    });

    // Eliminar los likes asociados (si existe la tabla)
    try {
      await Like.destroy({
        where: { visitaId: id },
        transaction: t
      });
    } catch (error) {
      console.log('No se encontró tabla de likes o ya no existe');
    }

    // Eliminar los comentarios asociados (si existe la tabla)
    try {
      const { Comentario } = await import('../models/index.js');
      await Comentario.destroy({
        where: { visitaId: id },
        transaction: t
      });
    } catch (error) {
      console.log('No se encontró tabla de comentarios o ya no existe');
    }

    // Eliminar la visita
    await visita.destroy({ transaction: t });

    await t.commit();

    res.json({
      mensaje: 'Visita eliminada exitosamente',
      visita: visitaEliminada
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar visita:', error);
    res.status(500).json({
      mensaje: 'Error al eliminar la visita',
      error: error.message
    });
  }
};

export const obtenerDiarioUsuario = async (req, res) => {
  try {
    // Usar el ID del usuario del token
    const usuarioId = req.user.id;

    // Obtener todas las visitas donde el usuario participó
    const participaciones = await VisitaParticipante.findAll({
      where: { 
        usuarioId,
        estado: 'aceptada'
      },
      include: [
        {
          model: Visita,
          as: 'visita',
          include: [
            {
              model: Cafe,
              as: 'cafeteria',
              attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'openingHours'],
              include: [
                {
                  model: Etiqueta,
                  as: 'etiquetas',
                  attributes: ['id', 'nombre', 'icono'],
                  through: { attributes: [] }
                }
              ]
            },
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            },
            {
              model: VisitaParticipante,
              as: 'participantes',
              include: [
                {
                  model: User,
                  as: 'usuario',
                  attributes: ['id', 'name', 'profileImage']
                }
              ]
            },
            {
              model: Resena,
              as: 'resenas',
              include: [
                {
                  model: User,
                  as: 'usuario',
                  attributes: ['id', 'name', 'profileImage']
                }
              ],
              required: false
            },
            {
              model: VisitaImagen,
              as: 'visitaImagenes',
              attributes: ['imageUrl', 'orden']
            },
            {
              model: Like,
              as: 'likes'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Si no hay participaciones, devolver respuesta vacía
    if (participaciones.length === 0) {
      return res.status(200).json({
        mensaje: '¡Aún no tienes visitas registradas! 🌟 Explora nuevas cafeterías y comparte tus experiencias.',
        totalVisitas: 0,
        visitas: [],
        sugerencia: 'Puedes empezar visitando alguna de nuestras cafeterías recomendadas y compartir tu experiencia.'
      });
    }

    // Transformar la respuesta para mantener compatibilidad con el frontend
    const visitasTransformadas = participaciones.map(participacion => {
      const visitaJSON = participacion.visita.toJSON();
      const creador = visitaJSON.usuario;
      const resenaCreador = visitaJSON.resenas?.find(r => r.usuarioId === creador?.id);

      console.log('🔍 TRANSFORMANDO VISITA DIARIO:', {
        id: visitaJSON.id,
        creador: creador ? { id: creador.id, name: creador.name, profileImage: creador.profileImage } : 'NULL',
        participantes: visitaJSON.participantes?.length || 0,
        resenas: visitaJSON.resenas?.length || 0
      });

      return {
        id: visitaJSON.id,
        fecha: visitaJSON.fecha,
        estado: visitaJSON.estado,
        esCompartida: visitaJSON.esCompartida,
        cafeteria: visitaJSON.cafeteria,
        imagenes: visitaJSON.visitaImagenes || [],
        likesCount: visitaJSON.likes?.length || 0,
        // Nueva estructura
        creador: creador ? {
          id: creador.id,
          name: creador.name,
          profileImage: creador.profileImage,
          resena: resenaCreador ? {
            id: resenaCreador.id,
            calificacion: resenaCreador.calificacion,
            comentario: resenaCreador.comentario,
            fecha: resenaCreador.createdAt,
            usuario: {
              id: creador.id,
              name: creador.name,
              profileImage: creador.profileImage
            }
          } : null
        } : null,
        participantes: (visitaJSON.participantes || [])
          .filter(p => p.rol !== 'creador')
          .map(p => ({
            id: p.usuario.id,
            name: p.usuario.name,
            profileImage: p.usuario.profileImage,
            estado: p.estado,
            rol: p.rol,
            fechaRespuesta: p.fechaRespuesta,
            resena: visitaJSON.resenas?.find(r => r.usuarioId === p.usuarioId) ? {
              id: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).id,
              calificacion: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).calificacion,
              comentario: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).comentario,
              fecha: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).createdAt,
              usuario: {
                id: p.usuario.id,
                name: p.usuario.name,
                profileImage: p.usuario.profileImage
              }
            } : null
          })),
        // Compatibilidad con estructura antigua
        usuario: creador,
        comentario: resenaCreador?.comentario,
        calificacion: resenaCreador?.calificacion
      };
    });

    console.log('📤 ENVIANDO DIARIO USUARIO:', visitasTransformadas.map(v => ({
      id: v.id,
      creador: v.creador ? { id: v.creador.id, name: v.creador.name } : 'NULL',
      participantes: v.participantes?.length || 0
    })));

    res.json({
      mensaje: 'Diario recuperado exitosamente',
      totalVisitas: visitasTransformadas.length,
      visitas: visitasTransformadas
    });

  } catch (error) {
    console.error('Error al obtener el diario del usuario:', error);
    res.status(500).json({
      mensaje: 'Error al obtener el diario del usuario',
      error: error.message
    });
  }
};

export const getVisitasByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Obtener las participaciones del usuario
    const participaciones = await VisitaParticipante.findAll({
      where: { 
        usuarioId: userId,
        estado: 'aceptada'
      },
      include: [
        {
          model: Visita,
          as: 'visita',
          include: [
            {
              model: Cafe,
              as: 'cafeteria',
              attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'openingHours'],
              include: [
                {
                  model: Etiqueta,
                  as: 'etiquetas',
                  attributes: ['id', 'nombre', 'icono'],
                  through: { attributes: [] }
                }
              ]
            },
            {
              model: VisitaImagen,
              as: 'visitaImagenes',
              attributes: ['imageUrl', 'orden']
            },
            {
              model: Like,
              as: 'likes'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transformar los datos y agregar el conteo de likes
    const visitasConLikes = participaciones.map(participacion => {
      const visita = participacion.visita;
      const visitaJSON = visita.toJSON();
      return {
        ...visitaJSON,
        likesCount: visitaJSON.likes.length,
        likes: undefined // Removemos el array de likes ya que solo necesitamos el conteo
      };
    });

    res.json({
      mensaje: 'Visitas encontradas',
      totalVisitas: visitasConLikes.length,
      visitas: visitasConLikes
    });
  } catch (error) {
    console.error('Error al obtener visitas:', error);
    res.status(500).json({ mensaje: 'Error al obtener las visitas' });
  }
};

export const getVisitaById = async (req, res) => {
  try {
    const { id } = req.params;

    const visita = await Visita.findOne({
      where: { id },
      include: [
        {
              model: Cafe,
              as: 'cafeteria',
              attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'openingHours'],
              include: [
                {
                  model: Etiqueta,
                  as: 'etiquetas',
                  attributes: ['id', 'nombre', 'icono'],
                  through: { attributes: [] }
                }
              ]
            },
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: VisitaParticipante,
          as: 'participantes',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        },
        {
          model: Resena,
          as: 'resenas',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ],
          required: false
        },
        {
          model: VisitaImagen,
          as: 'visitaImagenes',
          attributes: ['imageUrl', 'orden']
        },
        {
          model: Like,
          as: 'likes'
        }
      ],
      raw: false,
      nest: true
    });

    if (!visita) {
      return res.status(404).json({ mensaje: 'Visita no encontrada' });
    }

    // Transformar los datos para la respuesta
    const visitaJSON = visita.toJSON();
    
    console.log('🔍 DEBUG - Datos de la visita:', {
      id: visitaJSON.id,
      usuario: visitaJSON.usuario,
      resenas: visitaJSON.resenas?.map(r => ({
        id: r.id,
        usuarioId: r.usuarioId,
        calificacion: r.calificacion,
        comentario: r.comentario
      }))
    });

    // Asegurarnos de que tenemos la información del creador
    const creador = visitaJSON.usuario;
    const resenaCreador = visitaJSON.resenas?.find(r => r.usuarioId === creador.id);

    if (!creador) {
      console.error('❌ No se encontró el creador de la visita:', {
        visitaId: visitaJSON.id,
        usuarioId: visitaJSON.usuarioId
      });
      throw new Error('No se encontró el creador de la visita');
    }

    if (!resenaCreador) {
      console.error('❌ No se encontró la reseña del creador:', {
        visitaId: visitaJSON.id,
        usuarioId: visitaJSON.usuarioId,
        resenas: visitaJSON.resenas?.map(r => ({
          id: r.id,
          usuarioId: r.usuarioId,
          comentario: r.comentario
        }))
      });
      throw new Error('No se encontró la reseña del creador');
    }

    console.log('✅ Creador y reseña encontrados:', {
      creador: {
        id: creador.id,
        name: creador.name
      },
      resena: {
        id: resenaCreador.id,
        calificacion: resenaCreador.calificacion
      }
    });

    // Construir la respuesta final
    const visitaTransformada = {
      id: visitaJSON.id,
      fecha: visitaJSON.fecha,
      estado: visitaJSON.estado,
      esCompartida: visitaJSON.esCompartida,
      cafeteria: visitaJSON.cafeteria,
      imagenes: visitaJSON.visitaImagenes || [],
      likesCount: visitaJSON.likes?.length || 0,
      creador: {
        id: creador.id,
        name: creador.name,
        profileImage: creador.profileImage,
        resena: {
          id: resenaCreador.id,
          calificacion: resenaCreador.calificacion,
          comentario: resenaCreador.comentario,
          fecha: resenaCreador.createdAt,
          usuario: {
            id: creador.id,
            name: creador.name,
            profileImage: creador.profileImage
          }
        }
      },
      participantes: (visitaJSON.participantes || [])
        .filter(p => p.rol !== 'creador')
        .map(p => ({
          id: p.usuario.id,
          name: p.usuario.name,
          profileImage: p.usuario.profileImage,
          estado: p.estado,
          rol: p.rol,
          fechaRespuesta: p.fechaRespuesta,
          resena: visitaJSON.resenas?.find(r => r.usuarioId === p.usuarioId) ? {
            id: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).id,
            calificacion: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).calificacion,
            comentario: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).comentario,
            fecha: visitaJSON.resenas.find(r => r.usuarioId === p.usuarioId).createdAt,
            usuario: {
              id: p.usuario.id,
              name: p.usuario.name,
              profileImage: p.usuario.profileImage
            }
          } : null
        }))
    };



    res.json({ mensaje: 'Visita encontrada', visita: visitaTransformada });
  } catch (error) {
    console.error('Error al obtener visita:', error);
    res.status(500).json({ mensaje: 'Error al obtener la visita' });
  }
};