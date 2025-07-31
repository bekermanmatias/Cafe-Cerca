const API_URL = 'http://localhost:3000/api';

async function testEndpointEstadisticas() {
  try {
    console.log('🧪 Probando endpoint de estadísticas...');

    // Primero necesitamos obtener un token válido
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'ysy.a@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    const userId = loginData.user.id;

    console.log(`👤 Usuario autenticado: ${loginData.user.name} (ID: ${userId})`);

    // Probar el endpoint de estadísticas
    const statsResponse = await fetch(`${API_URL}/estadisticas/usuarios/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const stats = await statsResponse.json();
    console.log('\n📊 Estadísticas obtenidas:');
    console.log(`  - Total visitas: ${stats.totalVisitas}`);
    console.log(`  - Cafeterías únicas: ${stats.cafeteriasUnicas}`);
    console.log(`  - Promedio calificaciones: ${stats.promedioCalificaciones}`);
    console.log(`  - Visitas individuales: ${stats.visitasIndividuales}`);
    console.log(`  - Visitas compartidas como creador: ${stats.visitasCompartidasCreador}`);
    console.log(`  - Visitas como invitado: ${stats.visitasComoInvitado}`);
    console.log(`  - Cafeterías favoritas: ${stats.cafeteriasFavoritas.length}`);
    console.log(`  - Progreso mensual: ${stats.progresoMensual.length} meses`);

    if (stats.cafeteriasFavoritas.length > 0) {
      console.log('\n🏆 Top cafeterías:');
      stats.cafeteriasFavoritas.forEach((cafe, index) => {
        console.log(`  ${index + 1}. ${cafe.cafeteria.name} - ${cafe.cantidadVisitas} visitas`);
      });
    }

    if (stats.progresoMensual.length > 0) {
      console.log('\n📈 Progreso mensual:');
      stats.progresoMensual.forEach(mes => {
        console.log(`  - ${mes.mes}: ${mes.cantidadVisitas} visitas`);
      });
    }

    console.log('✅ Endpoint funcionando correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEndpointEstadisticas(); 