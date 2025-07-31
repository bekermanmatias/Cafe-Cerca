import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import visitasRoutes from './routes/visita.routes.js';
import cafesRoutes from './routes/cafes.js';
import comentariosRoutes from './routes/comentarios.routes.js';
import authRoutes from './routes/auth.routes.js';
import likesRoutes from './routes/likes.routes.js';
import savedCafesRoutes from './routes/savedCafes.routes.js';
import estadisticasRoutes from './routes/estadisticas.routes.js';
import amigosRoutes from './routes/amigos.routes.js';
import userRoutes from './routes/user.routes.js';
import { testConnection } from './config/database.js';

// Importar modelos y sus relaciones
import './models/index.js';

// Configuración de variables de entorno
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas de la API
app.use('/api/visitas', visitasRoutes);
app.use('/api/cafes', cafesRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/saved-cafes', savedCafesRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/amigos', amigosRoutes);
app.use('/api/users', userRoutes);

// Mostrar rutas disponibles por consola
console.log('📋 Rutas disponibles:');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/health');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/api/visitas');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/api/visitas/usuario/1');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/api/cafes');
console.log('   POST http://localhost:' + (process.env.PORT || 3000) + '/api/cafes');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/api/comentarios');
console.log('   POST http://localhost:' + (process.env.PORT || 3000) + '/api/comentarios');
console.log('   POST http://localhost:' + (process.env.PORT || 3000) + '/api/amigos/enviar');
console.log('   PATCH http://localhost:' + (process.env.PORT || 3000) + '/api/amigos/responder/:solicitudId');
console.log('   DELETE http://localhost:' + (process.env.PORT || 3000) + '/api/amigos/eliminar');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/api/amigos/lista');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/api/amigos/solicitudes/recibidas');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/api/amigos/solicitudes/enviadas');

// Verificar configuración JWT
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET no está configurado en las variables de entorno');
} else {
  console.log('✅ JWT_SECRET configurado correctamente');
}

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({
    mensaje: 'Algo salió mal!',
    error: err.message,
    stack: err.stack // para más detalle en desarrollo
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Prueba de conexión a la base de datos al iniciar
testConnection()
  .then(() => console.log('✅ Base de datos conectada'))
  .catch(err => console.error('❌ Error al conectar la base de datos:', err));

export default app;
