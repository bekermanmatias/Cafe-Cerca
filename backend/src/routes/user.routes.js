import express from 'express';
import { autenticarJWT } from '../middlewares/authMiddleware.js';
import {
  buscarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  cambiarContrasena,
  eliminarUsuario
} from '../controllers/user.controller.js';

const router = express.Router();

// Buscar usuarios (query)
router.get('/search', autenticarJWT, buscarUsuarios);

// Obtener usuario por id
router.get('/:id', autenticarJWT, obtenerUsuario);

// Actualizar usuario (nombre, email, avatar)
router.put('/:id', autenticarJWT, actualizarUsuario);

// Cambiar contraseña
router.put('/:id/password', autenticarJWT, cambiarContrasena);

// Eliminar usuario
router.delete('/:id', autenticarJWT, eliminarUsuario);

export default router;
