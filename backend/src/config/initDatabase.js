import sequelize from './database.js';
import { Visita, Cafe, VisitaImagen, User, Comentario, Like, SavedCafe } from '../models/index.js';
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

    // Crear usuarios famosos si no existen
    const famousExists = await User.findOne({ where: { email: 'maria.becerra@example.com' } });
    if (!famousExists) {
      const defaultPassword = await bcrypt.hash('123456', 10);
      await User.bulkCreate([
        {
          email: 'maria.becerra@example.com',
          password: defaultPassword,
          name: 'La Nena de Argentina',
          profileImage: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753829816/73d9b06f-7c0b-467b-be67-6573eb1a760b.png'
        },
        {
          email: 'duki@example.com',
          password: defaultPassword,
          name: 'Duki',
          profileImage: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753829855/1925253e-4212-4ee0-ac4d-b1d2e186f4bd.png'
        },
        {
          email: 'bizarrap@example.com',
          password: defaultPassword,
          name: 'Bizarrap',
          profileImage: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753829921/544d8263-56d1-47ea-9545-839e5e6fa512.png'
        },
        {
          email: 'tini@example.com',
          password: defaultPassword,
          name: 'TINI',
          profileImage: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753829967/e91a11ce-a248-434e-8c6c-7c625d527b65.png'
        },
        {
          email: 'lit.killah@example.com',
          password: defaultPassword,
          name: 'Lit Killah',
          profileImage: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753830012/c7a79b57-acab-4339-ba64-2680a5d5781d.png'
        },
        {
          email: 'nicki.nicole@example.com',
          password: defaultPassword,
          name: 'Nicki Nicole',
          profileImage: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753830062/2e5fdc01-ed8b-42ac-932e-b847c359ad68.png'
        },
        {
          email: 'trueno@example.com',
          password: defaultPassword,
          name: 'Trueno',
          profileImage: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753830084/d63d80c0-12af-47b5-86de-226f5cdcab10.png'
        },
        {
          email: 'emilia@example.com',
          password: defaultPassword,
          name: 'Emilia Mernes',
          profileImage: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753830130/5d3e6d89-c8d3-48aa-8553-9619322c25ba.png'
        },
        {
          email: 'ysy.a@example.com',
          password: defaultPassword,
          name: 'YSY A',
          profileImage: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753830170/ee773850-4887-4faa-bcef-20977c58e7a9.png'
        },
        {
          email: 'neo.pistea@example.com',
          password: defaultPassword,
          name: 'Neo Pistea',
          profileImage: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753830207/3e7908f6-ae29-468b-aca2-1eed639f7337.png'
        }
      ]);
      console.log('✅ Usuarios de muestra creados');
    }

    // Crear algunos cafés iniciales si no existen
    const cafeExists = await Cafe.findOne();
    if (!cafeExists) {
      await Cafe.bulkCreate([
        {
          name: 'Café Havanna C. 49 ',
          address: 'Calle 49 621, La Plata',
          lat: -34.919861,
          lng: -57.952897,
          openingHours: 'Lunes a Domingo 8:00 - 22:00',
          rating: 4.3,
          tags: ['tradicional', 'franquicia', 'alfajores'],
          imageUrl: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753829226/08947a70-3259-4584-b9c3-0568046cfc04.png'
        },
        {
          name: 'Botanica Tienda & Café',
          address: 'Calle 58 823, La Plata',
          lat: -34.922095,
          lng: -57.949466,
          openingHours: 'Martes a Domingo 9:00 - 19:00',
          rating: 4.7,
          tags: ['café de especialidad', 'brunch', 'tienda', 'ambiente natural'],
          imageUrl: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753828939/9f6fa8fe-99d6-44ec-b83a-14e165f27c28.png'
        },
        {
          name: 'Café Martínez La Plata',
          address: 'Calle 8 esquina 50, La Plata',
          lat: -34.919950,
          lng: -57.954744,
          openingHours: 'Lunes a Domingo 7:00 - 21:00',
          rating: 4.2,
          tags: ['franquicia', 'desayunos', 'meriendas'],
          imageUrl: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753657194/cafecerca/visitas/g3adzqzxbbcfxfrz4c4b.jpg'
        },
        {
          name: 'Mumi\'s Patisserie',
          address: 'Calle 46 780, La Plata',
          lat: -34.921543,
          lng: -57.952234,
          openingHours: 'Martes a Domingo 9:00 - 20:00',
          rating: 4.6,
          tags: ['pastelería francesa', 'café', 'brunch', 'macarons'],
          imageUrl: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753828840/4488ea12-3610-4959-be7b-6e94022ef91d.png'
        },
        {
          name: 'SinTaccTica',
          address: 'Av. 7 206, La Plata',
          lat: -34.911847,
          lng: -57.947756,
          openingHours: 'Martes a Domingo 9:00 - 20:00',
          rating: 4.8,
          tags: ['sin gluten', 'café', 'pastelería celíaca', 'brunch'],
          imageUrl: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753828572/138cdd2b-7161-4c2e-9522-fc166f65d53a.png'
        },
        {
          name: 'Tostado Café Club',
          address: 'Calle 51 535 entre 5 y 6, La Plata',
          lat: -34.917603,
          lng: -57.953595,
          openingHours: 'Martes a Domingo 9:00 - 19:00',
          rating: 4.5,
          tags: ['café de especialidad', 'brunch', 'ambiente moderno', 'tostado propio'],
          imageUrl: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753828738/af1506df-ebda-408e-9b18-a71c850a0974.png'
        },
        {
          name: 'Afán en la Cuadra',
          address: 'Calle 57 632, La Plata',
          lat: -34.920494,
          lng: -57.947532,
          openingHours: 'Martes a Domingo 9:00 - 20:00',
          rating: 4.7,
          tags: ['café de especialidad', 'brunch', 'ambiente moderno', 'pastelería artesanal'],
          imageUrl: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753658328/cafecerca/visitas/vfq5tkd8lworx85mdsvv.jpg'
        },
        {
          name: 'Blu pan & café',
          address: 'Calle 37 entre 3 y 4 N°425, La Plata',
          lat: -34.915099,
          lng: -57.947774,
          openingHours: 'Lunes a Sábado 8:00 - 20:00',
          rating: 4.6,
          tags: ['café de especialidad', 'panadería artesanal', 'brunch', 'pastelería'],
          imageUrl: 'https://res.cloudinary.com/dpzhs3vyi/image/upload/v1753658065/cafecerca/visitas/tatev7ju82hg6cguygsp.jpg'
        }
      ]);
      console.log('✅ Cafeterías iniciales de La Plata creadas');
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
      { model: Comentario, name: 'comentarios' },
      { model: Like, name: 'likes' },
      { model: SavedCafe, name: 'saved_cafes' }
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
    await Like.sync({ alter: false });
    await SavedCafe.sync({ alter: false });
    
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