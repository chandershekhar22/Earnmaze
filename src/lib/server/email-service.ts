import { Logger } from '../utils/app-logger';
import { sendTask } from '../utils/celery';

// This would integrate with your Celery worker to send emails
// For now, we'll create a placeholder that logs the reset link
export async function sendPasswordResetEmail(email: string, resetToken: string, appUrl?: string): Promise<void> {
	try {
		const baseUrl = appUrl || process.env.PUBLIC_APP_URL || 'http://localhost:5173';
		const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
		
		// TODO: Queue email task with worker
		// For development, we'll log it
		Logger.root.info(
			{ context: 'email', email, resetToken: resetToken.slice(0, 8) + '...' },
			`Password reset link: ${resetLink}`
		);

		// In production, you would queue this with your Celery worker:
		await sendTask('email.send.reset.password', [email, resetLink]);
	} catch (error) {
		Logger.root.error(
			{ context: 'errors', email, error },
			'Failed to send password reset email'
		);
		throw error;
	}
}

export async function sendWelcomeEmail(email: string, name: string|null): Promise<void> {
    try {
        await sendTask('email.send.welcome', [email, name?.trim() || ''])
    } catch (error) {
        Logger.root.error(
            { context: 'errors', email, error },
            'Failed to send welcome email'
        );
        throw error;
    }
}

export async function sendVerificationEmail(email: string, otp: string): Promise<void> {  
    try {
        await sendTask('email.send.verify', [email, otp]);
    } catch (error) {
        Logger.root.error(
            { context: 'errors', email, error },
            'Failed to send verification email'
        );
        throw error;
    }
}   

