require('dotenv').config();

const useRailway = process.env.USE_RAILWAY === 'true';

const development = useRailway ? {
  username: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'railway',
  host: 'yamanote.proxy.rlwy.net',
  port: 39880,
  dialect: 'mysql'
} : {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql'
};

module.exports = {
  development,
  test: development,
  production: development
};
