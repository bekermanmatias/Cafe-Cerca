import { User } from '../models/index.js';
import sequelize from '../config/database.js';

async function listUsers() {
  try {
    console.log('👥 Listando usuarios...');

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'createdAt']
    });

    console.log(`📊 Total de usuarios: ${users.length}`);
    console.log('\n📋 Usuarios:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

listUsers(); 