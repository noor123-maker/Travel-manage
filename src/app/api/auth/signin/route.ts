import getClient from '@/lib/mongo';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return new Response(JSON.stringify({ error: 'Missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    let client;
    try {
      client = await getClient();
    } catch (dbErr: any) {
      console.error('DB connection error in signin:', dbErr);
      return new Response(JSON.stringify({ error: dbErr?.message || 'Database connection error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const db = client.db();
    const users = db.collection('users');

  const user = await users.findOne({ email: email.toLowerCase() });
  if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    const ok = await bcrypt.compare(password, user.passwordHash || '');
  if (!ok) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const jwtModule = await import('jsonwebtoken');
  const jwt = (jwtModule as any).default || jwtModule;
  const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET || 'changeme', { expiresIn: '7d' });

    // Set cookie
    const res = new Response(JSON.stringify({ ok: true, token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    // set cookie header
    res.headers.set('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
    return res;
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ error: 'Method GET not allowed. Use POST to sign in.' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
