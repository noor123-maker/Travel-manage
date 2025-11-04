import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

if (!host || !port || !user || !pass) {
  // We'll throw when trying to send; don't crash during import.
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  if (!host || !port || !user || !pass) {
    console.warn('SMTP not configured. Skipping sendEmail.');
    console.log({ to, subject, text });
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject,
    text,
    html,
  });

  return info;
}
