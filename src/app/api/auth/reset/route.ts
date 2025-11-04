import getClient from '@/lib/mongo';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) return new Response(JSON.stringify({ error: 'Missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // verify token
    const jwtModule = await import('jsonwebtoken');
    const jwt = (jwtModule as any).default || jwtModule;
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    let client;
    try {
      client = await getClient();
    } catch (dbErr: any) {
      console.error('DB connection error in reset:', dbErr);
      return new Response(JSON.stringify({ error: dbErr?.message || 'Database connection error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const db = client.db();
    const users = db.collection('users');

    const user = await users.findOne({ resetToken: token });
  if (!user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (new Date(user.resetTokenExpires) < new Date()) return new Response(JSON.stringify({ error: 'Token expired' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await users.updateOne({ _id: user._id }, { $set: { passwordHash: hash }, $unset: { resetToken: '', resetTokenExpires: '' } });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ error: 'Method GET not allowed. Use POST to reset a password.' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
