import { Amigos, User } from './src/models/index.js';
import { Op } from 'sequelize';

// Función para probar la validación de amigos
async function testAmigosValidation() {
  try {
    console.log('=== PRUEBA DE VALIDACIÓN DE AMIGOS ===');
    
    // Obtener todos los usuarios
    const usuarios = await User.findAll({
      attributes: ['id', 'name', 'email']
    });
    
    console.log('Usuarios disponibles:', usuarios.map(u => ({ id: u.id, name: u.name })));
    
    if (usuarios.length < 2) {
      console.log('Se necesitan al menos 2 usuarios para la prueba');
      return;
    }
    
    const usuario1 = usuarios[0];
    const usuario2 = usuarios[1];
    
    console.log(`\nProbando con usuario 1: ${usuario1.name} (ID: ${usuario1.id})`);
    console.log(`Probando con usuario 2: ${usuario2.name} (ID: ${usuario2.id})`);
    
    // Buscar relaciones de amistad entre estos usuarios
    const relaciones = await Amigos.findAll({
      where: {
        [Op.or]: [
          { userId: usuario1.id, friendId: usuario2.id },
          { userId: usuario2.id, friendId: usuario1.id }
        ]
      }
    });
    
    console.log('\nRelaciones de amistad encontradas:', relaciones.map(r => ({
      id: r.id,
      userId: r.userId,
      friendId: r.friendId,
      status: r.status
    })));
    
    // Simular la validación del controlador
    const amigosIds = [usuario2.id];
    const usuarioId = usuario1.id;
    
    console.log(`\nSimulando validación para usuario ${usuarioId} con amigos ${amigosIds}`);
    
    const amigos = await Amigos.findAll({
      where: {
        [Op.or]: [
          { userId: usuarioId, friendId: { [Op.in]: amigosIds }, status: 'accepted' },
          { userId: { [Op.in]: amigosIds }, friendId: usuarioId, status: 'accepted' }
        ]
      }
    });
    
    console.log('Amigos encontrados:', amigos.length, 'de', amigosIds.length);
    console.log('Relaciones encontradas:', amigos.map(a => ({
      id: a.id,
      userId: a.userId,
      friendId: a.friendId,
      status: a.status
    })));
    
    if (amigos.length !== amigosIds.length) {
      console.log('❌ ERROR: Algunos amigos no fueron encontrados o no están confirmados');
      
      const amigosEncontradosIds = amigos.map(a => 
        a.userId === usuarioId ? a.friendId : a.userId
      );
      const amigosNoEncontrados = amigosIds.filter(id => !amigosEncontradosIds.includes(id));
      console.log('Amigos no encontrados:', amigosNoEncontrados);
      
      // Verificar si existe alguna relación pero no está aceptada
      const todasLasRelaciones = await Amigos.findAll({
        where: {
          [Op.or]: [
            { userId: usuarioId, friendId: { [Op.in]: amigosIds } },
            { userId: { [Op.in]: amigosIds }, friendId: usuarioId }
          ]
        }
      });
      
      console.log('Todas las relaciones (incluyendo pendientes):', todasLasRelaciones.map(r => ({
        id: r.id,
        userId: r.userId,
        friendId: r.friendId,
        status: r.status
      })));
      
    } else {
      console.log('✅ ÉXITO: Todos los amigos fueron encontrados y están confirmados');
    }
    
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testAmigosValidation().then(() => {
  console.log('\n=== PRUEBA COMPLETADA ===');
  process.exit(0);
}).catch(error => {
  console.error('Error ejecutando la prueba:', error);
  process.exit(1);
}); 