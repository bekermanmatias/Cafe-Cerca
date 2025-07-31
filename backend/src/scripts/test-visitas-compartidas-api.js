import sequelize from '../config/database.js';
import { Visita, VisitaParticipante, User, Cafe, Resena } from '../models/index.js';

console.log('🧪 Probando APIs de visitas compartidas...');

const testVisitasCompartidasAPI = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // 1. Verificar visitas existentes
    console.log('\n📋 1. Verificando visitas existentes...');
    const visitas = await Visita.findAll({
      include: [
        {
          model: Cafe,
          as: 'cafeteria',
          attributes: ['id', 'name', 'address', 'imageUrl', 'rating', 'tags', 'openingHours']
        },
        {
          model: VisitaParticipante,
          as: 'participantes',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        },
        {
          model: Resena,
          as: 'resenas',
          include: [
            {
              model: User,
              as: 'usuario',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        }
      ]
    });
    
    console.log(`✅ Encontradas ${visitas.length} visitas:`);
    visitas.forEach(visita => {
      const visitaJSON = visita.toJSON();
      const creador = visitaJSON.participantes?.find(p => p.rol === 'creador')?.usuario || null;
      const participantes = visitaJSON.participantes?.filter(p => p.rol !== 'creador') || [];
      const resenas = visitaJSON.resenas || [];
      
      console.log(`  📝 Visita ID ${visita.id}:`);
      console.log(`    ☕ Cafetería: ${visitaJSON.cafeteria?.name}`);
      console.log(`    👤 Creador: ${creador?.name || 'N/A'}`);
      console.log(`    👥 Participantes: ${participantes.length} (${participantes.map(p => p.usuario.name).join(', ')})`);
      console.log(`    📝 Reseñas: ${resenas.length} (${resenas.map(r => `${r.usuario.name}: ${r.calificacion}⭐`).join(', ')})`);
      console.log(`    🔗 Compartida: ${visitaJSON.esCompartida ? 'Sí' : 'No'}`);
    });
    
    // 2. Verificar visitas compartidas específicamente
    console.log('\n📋 2. Verificando visitas compartidas...');
    const visitasCompartidas = visitas.filter(v => v.esCompartida);
    console.log(`✅ Encontradas ${visitasCompartidas.length} visitas compartidas`);
    
    visitasCompartidas.forEach(visita => {
      const visitaJSON = visita.toJSON();
      const participantes = visitaJSON.participantes?.filter(p => p.rol !== 'creador') || [];
      console.log(`  📝 Visita ID ${visita.id}: ${participantes.length} participantes`);
    });
    
    // 3. Verificar reseñas de visitas compartidas
    console.log('\n📋 3. Verificando reseñas de visitas compartidas...');
    const visitasConResenas = visitas.filter(v => v.resenas && v.resenas.length > 0);
    console.log(`✅ Encontradas ${visitasConResenas.length} visitas con reseñas`);
    
    visitasConResenas.forEach(visita => {
      const visitaJSON = visita.toJSON();
      const resenas = visitaJSON.resenas || [];
      console.log(`  📝 Visita ID ${visita.id}:`);
      resenas.forEach(resena => {
        console.log(`    👤 ${resena.usuario.name}: ${resena.calificacion}⭐ - "${resena.comentario}"`);
      });
    });
    
    // 4. Verificar estructura de datos para frontend
    console.log('\n📋 4. Verificando estructura de datos para frontend...');
    const visitaEjemplo = visitas.find(v => v.esCompartida);
    if (visitaEjemplo) {
      const visitaJSON = visitaEjemplo.toJSON();
      const creador = visitaJSON.participantes?.find(p => p.rol === 'creador')?.usuario || null;
      const participantes = visitaJSON.participantes?.filter(p => p.rol !== 'creador') || [];
      
      console.log('  📊 Estructura de respuesta para frontend:');
      console.log(`    ✅ usuario: ${creador ? 'Presente' : 'Faltante'} (${creador?.name})`);
      console.log(`    ✅ participantes: ${participantes.length} participantes`);
      console.log(`    ✅ resenas: ${visitaJSON.resenas?.length || 0} reseñas`);
      console.log(`    ✅ cafeteria: ${visitaJSON.cafeteria ? 'Presente' : 'Faltante'}`);
      console.log(`    ✅ esCompartida: ${visitaJSON.esCompartida}`);
    }
    
    console.log('\n✅ Prueba de APIs de visitas compartidas completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

testVisitasCompartidasAPI()
  .then(() => {
    console.log('✅ Script de prueba completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en script de prueba:', error);
    process.exit(1);
  }); 