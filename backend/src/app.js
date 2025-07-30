import express from 'express';
import cors from 'cors';
import visitasRoutes from './routes/visita.routes.js';
import cafesRoutes from './routes/cafes.js';
import comentariosRoutes from './routes/comentarios.routes.js';
import authRoutes from './routes/auth.routes.js';
import likesRoutes from './routes/likes.routes.js';
import savedCafesRoutes from './routes/savedCafes.routes.js';
import estadisticasRoutes from './routes/estadisticas.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Imprimir rutas disponibles
console.log('📋 Rutas disponibles:');
console.log('   GET  http://localhost:3000/health');
console.log('   GET  http://localhost:3000/api/visitas');
console.log('   GET  http://localhost:3000/api/visitas/usuario/1');
console.log('   GET  http://localhost:3000/api/cafes');
console.log('   POST http://localhost:3000/api/cafes');
console.log('   GET  http://localhost:3000/api/visita/:visitaId/comentarios');
console.log('   POST http://localhost:3000/api/visita/:visitaId/comentarios');

// Rutas API
app.use('/api/visitas', visitasRoutes);
app.use('/api/cafes', cafesRoutes);
app.use('/api/comentarios', comentariosRoutes); // Cambiado de /api/visita a /api/comentarios
app.use('/api/auth', authRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/saved-cafes', savedCafesRoutes);
app.use('/api/estadisticas', estadisticasRoutes);

export default app;
