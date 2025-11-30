export function getEmailVerificationHtml(userName: string, verificationLink: string): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px; font-weight: bold; color: #ffffff;">✉️</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px 30px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">
                                Hi <strong>${userName}</strong>,
                            </p>
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">
                                Thank you for signing up with EarnMaze! Please verify your email address to activate your account and start earning rewards.
                            </p>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                                Click the button below to confirm your email address:
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 12px; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); text-align: center;">
                                        <a href="${verificationLink}" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none;">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                Or copy and paste this link into your browser:<br>
                                <a href="${verificationLink}" style="color: #3b82f6; word-break: break-all;">${verificationLink}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Info -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e40af;">
                                    <strong>Why verify?</strong><br>
                                    Verifying your email helps us keep your account secure and ensures you receive important updates about your earnings.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; text-align: center;">
                                Questions? Contact us at <a href="mailto:support@earnmaze.com" style="color: #3b82f6; text-decoration: none;">support@earnmaze.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                                © ${new Date().getFullYear()} EarnMaze. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

export function getEmailVerificationText(userName: string, verificationLink: string): string {
	return `
Hi ${userName},

Thank you for signing up with EarnMaze! Please verify your email address to activate your account and start earning rewards.

Click the link below to confirm your email address:

${verificationLink}

Why verify?
Verifying your email helps us keep your account secure and ensures you receive important updates about your earnings.

Questions? Contact us at support@earnmaze.com

© ${new Date().getFullYear()} EarnMaze. All rights reserved.
	`.trim();
}
