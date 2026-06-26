import nodemailer from 'nodemailer';

/**
 * Send an email via Gmail using an App Password.
 *
 * Gmail App Passwords are 16-character strings that Google displays
 * with spaces (e.g. "htic afzf qtki gegk") — spaces must be STRIPPED
 * before use. We also create the transporter lazily so that process.env
 * is fully loaded when this function is first called.
 */
const sendEmail = async ({ to, subject, html }) => {
  // Strip spaces from the App Password (Google shows them grouped for readability)
  const appPassword = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!process.env.EMAIL_USER || !appPassword) {
    console.error('[sendEmail] EMAIL_USER or EMAIL_PASS is not set in .env');
    // Silently skip sending in dev if credentials are missing, so the app doesn't crash
    if (process.env.NODE_ENV === 'development') return;
    throw new Error('Email credentials are not configured.');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: appPassword,
    },
  });

  await transporter.sendMail({
    from: `"DailyPen Security" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;
