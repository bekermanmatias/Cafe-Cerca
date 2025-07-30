import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const useRailway = process.env.USE_RAILWAY === 'true';

let sequelize;

if (useRailway) {
  sequelize = new Sequelize(
    process.env.MYSQL_DATABASE,
    process.env.MYSQLUSER,
    process.env.MYSQL_ROOT_PASSWORD,
    {
      host: 'yamanote.proxy.rlwy.net',
      dialect: 'mysql',
      port: 39880,
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      port: process.env.DB_PORT,
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión a la base de datos exitosa (${useRailway ? 'Railway' : 'Local'})`);
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
};

export default sequelize;