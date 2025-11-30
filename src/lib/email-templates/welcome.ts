export function getWelcomeEmailHtml(userName: string): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to EarnMaze</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px; font-weight: bold; color: #ffffff;">EM</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to EarnMaze!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px 30px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">
                                Hi <strong>${userName}</strong>,
                            </p>
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">
                                Thank you for joining EarnMaze! We're thrilled to have you as part of our community.
                            </p>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                                Start earning rewards by completing surveys, participating in tasks, and engaging with our platform. Every action brings you closer to exciting rewards!
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 12px; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); text-align: center;">
                                        <a href="https://earnmaze.com/dashboard" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none;">
                                            Get Started
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Features -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px;">
                                <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: #111827;">What's next?</h2>
                                <ul style="margin: 0; padding: 0; list-style: none;">
                                    <li style="margin-bottom: 12px; padding-left: 28px; position: relative; color: #374151; font-size: 14px; line-height: 1.6;">
                                        <span style="position: absolute; left: 0; top: 0; color: #10b981; font-weight: bold;">✓</span>
                                        Complete your profile to unlock more opportunities
                                    </li>
                                    <li style="margin-bottom: 12px; padding-left: 28px; position: relative; color: #374151; font-size: 14px; line-height: 1.6;">
                                        <span style="position: absolute; left: 0; top: 0; color: #10b981; font-weight: bold;">✓</span>
                                        Browse available surveys and tasks
                                    </li>
                                    <li style="margin-bottom: 0; padding-left: 28px; position: relative; color: #374151; font-size: 14px; line-height: 1.6;">
                                        <span style="position: absolute; left: 0; top: 0; color: #10b981; font-weight: bold;">✓</span>
                                        Start earning points and redeem rewards
                                    </li>
                                </ul>
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

export function getWelcomeEmailText(userName: string): string {
	return `
Hi ${userName},

Thank you for joining EarnMaze! We're thrilled to have you as part of our community.

Start earning rewards by completing surveys, participating in tasks, and engaging with our platform. Every action brings you closer to exciting rewards!

Get Started: https://earnmaze.com/dashboard

What's next?
✓ Complete your profile to unlock more opportunities
✓ Browse available surveys and tasks
✓ Start earning points and redeem rewards

Questions? Contact us at support@earnmaze.com

© ${new Date().getFullYear()} EarnMaze. All rights reserved.
	`.trim();
}
