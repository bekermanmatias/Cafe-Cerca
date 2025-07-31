import { Amigos, User } from './src/models/index.js';
import { Op } from 'sequelize';

// Función para crear amistades de prueba
async function crearAmistadesPrueba() {
  try {
    console.log('=== CREANDO AMISTADES DE PRUEBA ===');
    
    // Obtener todos los usuarios
    const usuarios = await User.findAll({
      attributes: ['id', 'name', 'email']
    });
    
    console.log('Usuarios disponibles:', usuarios.map(u => ({ id: u.id, name: u.name })));
    
    if (usuarios.length < 2) {
      console.log('Se necesitan al menos 2 usuarios para crear amistades');
      return;
    }
    
    // Crear algunas amistades de prueba
    const amistadesPrueba = [
      // Usuario 1 (Administrador) es amigo de Usuario 2 (La Nena de Argentina)
      { userId: 1, friendId: 2, status: 'accepted' },
      // Usuario 1 (Administrador) es amigo de Usuario 3 (Duki)
      { userId: 1, friendId: 3, status: 'accepted' },
      // Usuario 2 (La Nena de Argentina) es amigo de Usuario 4 (Bizarrap)
      { userId: 2, friendId: 4, status: 'accepted' },
      // Usuario 3 (Duki) es amigo de Usuario 5 (TINI)
      { userId: 3, friendId: 5, status: 'accepted' },
      // Usuario 12 (Matias) es amigo de Usuario 1 (Administrador)
      { userId: 12, friendId: 1, status: 'accepted' },
      // Usuario 13 (pepe) es amigo de Usuario 1 (Administrador)
      { userId: 13, friendId: 1, status: 'accepted' },
      // Usuario 14 (Patricio) es amigo de Usuario 1 (Administrador)
      { userId: 14, friendId: 1, status: 'accepted' },
    ];
    
    console.log('\nCreando amistades de prueba...');
    
    for (const amistad of amistadesPrueba) {
      // Verificar si ya existe la relación
      const existe = await Amigos.findOne({
        where: {
          [Op.or]: [
            { userId: amistad.userId, friendId: amistad.friendId },
            { userId: amistad.friendId, friendId: amistad.userId }
          ]
        }
      });
      
      if (existe) {
        console.log(`⚠️  Amistad entre usuario ${amistad.userId} y ${amistad.friendId} ya existe`);
        continue;
      }
      
      // Crear la relación de amistad
      await Amigos.create(amistad);
      console.log(`✅ Amistad creada: Usuario ${amistad.userId} ↔ Usuario ${amistad.friendId} (${amistad.status})`);
    }
    
    // Verificar las amistades creadas
    console.log('\n=== VERIFICANDO AMISTADES CREADAS ===');
    
    const todasLasAmistades = await Amigos.findAll({
      where: { status: 'accepted' }
    });
    
    console.log('Total de amistades confirmadas:', todasLasAmistades.length);
    
    for (const amistad of todasLasAmistades) {
      const usuario1 = usuarios.find(u => u.id === amistad.userId);
      const usuario2 = usuarios.find(u => u.id === amistad.friendId);
      
      if (usuario1 && usuario2) {
        console.log(`👥 ${usuario1.name} ↔ ${usuario2.name}`);
      }
    }
    
    console.log('\n=== AMISTADES DE PRUEBA CREADAS EXITOSAMENTE ===');
    
  } catch (error) {
    console.error('Error creando amistades de prueba:', error);
  }
}

// Ejecutar la función
crearAmistadesPrueba().then(() => {
  console.log('\n=== PROCESO COMPLETADO ===');
  process.exit(0);
}).catch(error => {
  console.error('Error ejecutando el script:', error);
  process.exit(1);
}); 