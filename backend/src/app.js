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
import resenasRoutes from './routes/resenas.routes.js';
import visitaParticipanteRoutes from './routes/visitaParticipante.routes.js';
import { testConnection } from './config/database.js';
import etiquetasRoutes from './routes/etiquetas.js';
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
app.use('/api/resenas', resenasRoutes);
app.use('/api/visita-participantes', visitaParticipanteRoutes);
app.use('/api/etiquetas', etiquetasRoutes);
// Mostrar rutas disponibles por consola
// Available routes logged

// Verificar configuración JWT
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET no está configurado en las variables de entorno');
} else {
  // JWT_SECRET configured correctly
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
  .then(() => {
  // Database connected
})
  .catch(err => console.error('❌ Error al conectar la base de datos:', err));

export default app;
