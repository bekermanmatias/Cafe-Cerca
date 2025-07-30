// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,      // Nombre de la base de datos
  process.env.DB_USER,      // Usuario
  process.env.DB_PASSWORD,  // Contraseña
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306, // puerto por defecto MySQL
    logging: false, // Desactivar logs SQL en consola (true para desarrollo)
    pool: {
      max: 10,      // Máximo conexiones simultáneas
      min: 0,       // Mínimo conexiones
      acquire: 30000, // Tiempo máximo para obtener conexión antes de error
      idle: 10000   // Tiempo máximo conexión inactiva antes de liberar
    }
  }
);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error; // Propaga error para que pueda manejarse afuera
  }
};

export default sequelize;
