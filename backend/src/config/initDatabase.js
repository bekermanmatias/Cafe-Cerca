import sequelize from './database.js';
import { Visita, Cafe, VisitaImagen, User, Comentario } from '../models/index.js';
import bcrypt from 'bcrypt';

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
          nombre: 'Café Tortoni',
          direccion: 'Av. de Mayo 825, Buenos Aires',
          latitud: -34.6085,
          longitud: -58.3795,
          horario: 'Lunes a Domingo 8:00 - 22:00'
        },
        {
          nombre: 'Café Martinez',
          direccion: 'Av. Santa Fe 1234, Buenos Aires',
          latitud: -34.5955,
          longitud: -58.3937,
          horario: 'Lunes a Sábado 7:30 - 20:00'
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