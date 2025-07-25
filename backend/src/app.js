import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import visitaRoutes from './routes/visita.routes.js';
import { testConnection } from './config/database.js';
import dotenv from 'dotenv';

// Configuración de variables de entorno
dotenv.config();

const app = express();

// Middlewares de seguridad y utilidades
app.use(helmet()); // Seguridad básica
app.use(cors({
  origin: '*', // Permitir cualquier origen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // Cache preflight por 24 horas
}));
app.use(morgan('dev')); // Logging de solicitudes HTTP
app.use(express.json()); // Parser para JSON
app.use(express.urlencoded({ extended: true })); // Parser para forms

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// Rutas de la API
app.use('/api', visitaRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    mensaje: 'Algo salió mal!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

// Prueba de conexión a la base de datos al iniciar
testConnection()
  .then(() => console.log('✅ Base de datos conectada'))
  .catch(err => console.error('❌ Error al conectar la base de datos:', err));

export default app;