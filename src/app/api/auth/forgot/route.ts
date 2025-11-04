import getClient from '@/lib/mongo';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: 'Missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    let client;
    try {
      client = await getClient();
    } catch (dbErr: any) {
      console.error('DB connection error in forgot:', dbErr);
      return new Response(JSON.stringify({ error: dbErr?.message || 'Database connection error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const db = client.db();
    const users = db.collection('users');

    const user = await users.findOne({ email: email.toLowerCase() });
  if (!user) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }); // don't reveal existence

  // create a short-lived reset token (JWT)
  const jwtModule = await import('jsonwebtoken');
  const jwt = (jwtModule as any).default || jwtModule;
  const resetToken = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET || 'changeme', { expiresIn: '1h' });

    // store token hash or raw token reference (we'll store the token and expiry for simplicity)
    await users.updateOne({ _id: user._id }, { $set: { resetToken, resetTokenExpires: new Date(Date.now() + 1000 * 60 * 60) } });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const subject = 'Password reset';
    const text = `Click the following link to reset your password: ${link}

This link will expire in 1 hour.`;

    await sendEmail(email, subject, text);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ error: 'Method GET not allowed. Use POST to request a password reset.' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
