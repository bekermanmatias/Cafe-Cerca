import express from 'express';
import { 
  invitarUsuarios, 
  responderInvitacion, 
  aceptarInvitacionConResena,
  obtenerInvitacionesPendientes, 
  obtenerParticipantes, 
  removerParticipante 
} from '../controllers/visitaParticipante.controller.js';
import { verifyToken as authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Invitar usuarios a una visita
router.post('/:visitaId/invitar', invitarUsuarios);

// Responder a una invitación
router.put('/:visitaId/respuesta', responderInvitacion);

// Aceptar invitación con reseña
router.post('/:visitaId/aceptar-con-resena', aceptarInvitacionConResena);

// Obtener invitaciones pendientes del usuario
router.get('/invitaciones-pendientes', obtenerInvitacionesPendientes);

// Obtener participantes de una visita
router.get('/:visitaId/participantes', obtenerParticipantes);

// Remover participante de una visita
router.delete('/:visitaId/participantes/:usuarioId', removerParticipante);

export default router; 