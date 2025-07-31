import express from 'express';
import { 
  crearVisitaCompartida, 
  responderInvitacion, 
  obtenerInvitacionesPendientes, 
  obtenerVisitasCompartidas,
  obtenerVisitaCompartida
} from '../controllers/visitaCompartida.controller.js';
import { upload } from '../config/cloudinary.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Crear una visita compartida e invitar amigos
router.post('/', upload.array('imagenes', 5), crearVisitaCompartida);

// Responder a una invitación (aceptar/rechazar)
router.put('/:visitaId/respuesta', responderInvitacion);

// Obtener invitaciones pendientes del usuario
router.get('/invitaciones-pendientes', obtenerInvitacionesPendientes);

// Obtener todas las visitas compartidas del usuario
router.get('/mis-visitas-compartidas', obtenerVisitasCompartidas);

// Obtener detalles de una visita compartida específica
router.get('/:visitaId', obtenerVisitaCompartida);

export default router; 