
import { db } from '../src/lib/server/db';
import { user } from '../src/lib/db/schema/auth';
import { hashPassword } from '../src/lib/server/auth';

async function seedUsers() {
  console.log('🌱 Seeding demo users...');

  try {
    // Create a demo user
    const demoUsers = [
      {
        name: 'John Doe',
        email: 'demo@example.com',
        password: await hashPassword('password123'),
      },
      {
        name: 'Jane Smith', 
        email: 'jane@example.com',
        password: await hashPassword('password123'),
      }
    ];

    await db.insert(user).values(demoUsers);
    console.log('✅ Demo users created successfully');
    console.log('📧 Demo logins:');
    console.log('   demo@example.com / password123');
    console.log('   jane@example.com / password123');
    console.log('🎉 Seeding completed!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedUsers };
