import { db } from '../src/lib/db';
import { user } from '../src/lib/db/schema/auth';
import { hashPassword, getUserByEmail, createUser } from '../src/lib/db/repositories/auth.repository.server';
import { eq } from 'drizzle-orm';

/**
 * Initialize admin user on application startup
 * Creates default admin if no admin exists and credentials are provided in env
 */
export async function initializeAdmin() {
	console.log('🔐 Checking admin user...');

	try {
		// Get admin credentials from environment variables
		const adminEmail = process.env.ADMIN_EMAIL;
		const adminPassword = process.env.ADMIN_PASSWORD;
		const adminName = process.env.ADMIN_NAME || 'Admin User';

		if (!adminEmail || !adminPassword) {
			console.log('ℹ️  No admin credentials in environment variables');
			console.log('   Set ADMIN_EMAIL and ADMIN_PASSWORD to auto-create admin user');
			return;
		}

		// Check if admin user already exists
		const existingAdmin = await getUserByEmail(adminEmail);

		if (existingAdmin) {
			console.log(`✅ Admin user already exists: ${adminEmail}`);
			
			// Check if user is actually an admin
			if (existingAdmin.userType !== 'admin') {
				console.log('⚠️  Warning: User exists but is not an admin. Updating role...');
				await db
					.update(user)
					.set({ userType: 'admin' })
					.where(eq(user.id, existingAdmin.id));
				console.log('✅ User role updated to admin');
			}
			
			return;
		}

		// Create new admin user
		console.log('📝 Creating admin user...');
		await createUser({
			email: adminEmail,
			password: adminPassword,
			name: adminName,
			userType: 'admin'
		});

		console.log('✅ Admin user created successfully!');
		console.log(`   Email: ${adminEmail}`);
		console.log(`   Name: ${adminName}`);
		console.log('🔒 You can now login with these credentials');

	} catch (error) {
		console.error('❌ Admin initialization failed:', error);
		// Don't throw error - allow app to start even if admin creation fails
		console.error('⚠️  Application will continue, but admin user was not created');
	}
}

/**
 * Check if any admin user exists in the system
 */
export async function hasAdminUser(): Promise<boolean> {
	try {
		const admins = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.userType, 'admin'))
			.limit(1);

		return admins.length > 0;
	} catch (error) {
		console.error('Error checking for admin users:', error);
		return false;
	}
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	initializeAdmin()
		.then(() => {
			console.log('🎉 Admin initialization completed');
			process.exit(0);
		})
		.catch((error) => {
			console.error('Fatal error during admin initialization:', error);
			process.exit(1);
		});
}
