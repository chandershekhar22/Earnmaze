import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

export async function sendEmail(options: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
}) {
  // Check if API key is configured
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return { success: false, error: 'Email service not configured' };
  }

  // Validate API key format
  if (!env.RESEND_API_KEY.startsWith('re_')) {
    console.error('Invalid RESEND_API_KEY format. It should start with "re_"');
    return { success: false, error: 'Invalid API key format' };
  }

  const resend = new Resend(env.RESEND_API_KEY);

  try {
    console.log('Sending email with options:', options);
    const { data, error } = await resend.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Exception sending email:', err);
    return { success: false, error: 'Network error or API unavailable' };
  }
}