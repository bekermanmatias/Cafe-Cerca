import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import visitaRoutes from './routes/visita.routes.js';
import { testConnection } from './config/database.js';
import dotenv from 'dotenv';
import cafesRoutes from './routes/cafes.js';

import './models/Cafe.js'; // registrar modelo
// Configuración de variables de entorno
dotenv.config();

const app = express();

// Middlewares de seguridad y utilidades
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// Rutas de la API
app.use('/api/visitas', visitaRoutes);
app.use('/api/cafes', cafesRoutes); // cambié a /api/cafes para que coincida con los logs

// Mostrar rutas disponibles por consola para que las veas
console.log('📋 Rutas disponibles:');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/health');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/api/visitas');
console.log('   GET  http://localhost:' + (process.env.PORT || 3000) + '/api/cafes');
console.log('   POST http://localhost:' + (process.env.PORT || 3000) + '/api/cafes');

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
