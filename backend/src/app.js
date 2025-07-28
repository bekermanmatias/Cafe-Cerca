import express from 'express';
import cors from 'cors';
import exampleRoutes from './routes/example.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Cafe Cerca funcionando',
    version: '1.0.0'
  });
});

app.use('/api/example', exampleRoutes);
app.use('/api/auth', authRoutes);

export default app;