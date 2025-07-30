import express from 'express';
import {
  enviarSolicitud,
  responderSolicitud,
  eliminarAmistad,
  obtenerAmigos,
  solicitudesRecibidas,
  solicitudesEnviadas
} from '../controllers/amigos.controller.js';

import { autenticarJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Proteger todas las rutas con JWT
router.use(autenticarJWT);

router.post('/enviar', enviarSolicitud);
router.patch('/responder/:solicitudId', responderSolicitud);
router.delete('/eliminar', eliminarAmistad);
router.get('/lista', obtenerAmigos);
router.get('/solicitudes/recibidas', solicitudesRecibidas);
router.get('/solicitudes/enviadas', solicitudesEnviadas);

export default router;
