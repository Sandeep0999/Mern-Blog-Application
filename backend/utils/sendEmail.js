import { Resend } from 'resend';

/**
 * Send an email via Resend API (HTTPS-based, works on Render free tier).
 * Resend free plan: 3,000 emails/month, 100/day.
 *
 * Set RESEND_API_KEY in your .env and Render environment variables.
 * From address: use "onboarding@resend.dev" until you verify a domain.
 */
const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[sendEmail] RESEND_API_KEY is not set in environment');
    if (process.env.NODE_ENV === 'development') return;
    throw new Error('Email credentials are not configured.');
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: 'DailyPen <onboarding@resend.dev>',
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export default sendEmail;
