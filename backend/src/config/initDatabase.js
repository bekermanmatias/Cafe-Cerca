import sequelize from './database.js';
import { Visita, Cafe, VisitaImagen, User, Comentario } from '../models/index.js';
import bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  try {
    console.log('Verificando migraciones pendientes...');
    
    // Ejecutar las migraciones pendientes
    const { stdout, stderr } = await execPromise('npx sequelize-cli db:migrate', {
      cwd: path.join(__dirname, '../../') // Directorio raíz del backend
    });

    if (stdout) console.log('Salida de migraciones:', stdout);
    if (stderr) console.error('Errores de migraciones:', stderr);

    console.log('✅ Migraciones completadas exitosamente');
  } catch (error) {
    // Si el error es porque las migraciones ya están actualizadas, no es un problema
    if (error.stdout && error.stdout.includes('No migrations were executed')) {
      console.log('✅ Base de datos ya está actualizada');
      return;
    }

    console.error('❌ Error ejecutando migraciones:', error);
    throw error;
  }
};

export const initializeDatabase = async () => {
  try {
    await runMigrations();
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
};

// Función para verificar si una tabla existe
async function checkTable(model) {
  try {
    await model.describe();
    console.log(`✅ Tabla ${model.tableName} existe`);
    return true;
  } catch (error) {
    console.log(`❌ Tabla ${model.tableName} no existe`);
    return false;
  }
}

// Función para crear datos iniciales
async function createInitialData() {
  try {
    // Crear usuario admin si no existe
    const adminExists = await User.findOne({ where: { email: 'admin@cafecerca.com' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        email: 'admin@cafecerca.com',
        password: hashedPassword,
        name: 'Administrador'
      });
      console.log('✅ Usuario administrador creado');
    }

    // Crear algunos cafés iniciales si no existen
    const cafeExists = await Cafe.findOne();
    if (!cafeExists) {
      await Cafe.bulkCreate([
        {
          name: 'Café Tortoni',
          address: 'Av. de Mayo 825, Buenos Aires',
          lat: -34.6085,
          lng: -58.3795,
          openingHours: 'Lunes a Domingo 8:00 - 22:00',
          rating: 4.5,
          tags: ['histórico', 'tradicional', 'turístico'],
          imageUrl: 'https://example.com/tortoni.jpg'
        },
        {
          name: 'Café Martinez',
          address: 'Av. Santa Fe 1234, Buenos Aires',
          lat: -34.5955,
          lng: -58.3937,
          openingHours: 'Lunes a Sábado 7:30 - 20:00',
          rating: 4.0,
          tags: ['moderno', 'franquicia'],
          imageUrl: 'https://example.com/martinez.jpg'
        }
      ]);
      console.log('✅ Cafés iniciales creados');
    }

  } catch (error) {
    console.error('❌ Error creando datos iniciales:', error);
  }
}

// Función principal de inicialización
export async function initDatabase() {
  try {
    // Verificar la conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa');

    // Verificar cada tabla
    console.log('\n📊 Verificando tablas existentes:');
    const tables = [
      { model: User, name: 'Users' },
      { model: Cafe, name: 'cafes' },
      { model: Visita, name: 'visitas' },
      { model: VisitaImagen, name: 'visita_imagenes' },
      { model: Comentario, name: 'comentarios' }
    ];

    for (const table of tables) {
      await checkTable(table.model);
    }

    // Sincronizar los modelos con la base de datos
    console.log('\n🔄 Sincronizando modelos con la base de datos...');
    
    // Sincronizar en orden específico debido a las relaciones
    await User.sync({ alter: false });
    await Cafe.sync({ alter: false });
    await Visita.sync({ alter: false });
    await VisitaImagen.sync({ alter: false });
    await Comentario.sync({ alter: false });
    
    console.log('✅ Sincronización de tablas completada');

    // Crear datos iniciales
    console.log('\n📝 Verificando datos iniciales...');
    await createInitialData();
    console.log('✅ Verificación de datos iniciales completada\n');

    return true;
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    return false;
  }
} 