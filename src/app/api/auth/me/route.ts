import getClient from '@/lib/mongo';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/\btoken=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : null;
    if (!token) return new Response(JSON.stringify({ user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    // dynamic-import jsonwebtoken to ensure this file remains compatible with static export settings
    const jwtModule = await import('jsonwebtoken');
    const jwt = (jwtModule as any).default || jwtModule;
    const secret = process.env.JWT_SECRET || 'changeme';
    let payload: any = null;
    try {
      payload = jwt.verify(token, secret);
    } catch (e) {
      return new Response(JSON.stringify({ user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const userId = payload?.sub;
    if (!userId) return new Response(JSON.stringify({ user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    // fetch user from DB
    let client;
    try {
      client = await getClient();
    } catch (dbErr: any) {
      console.error('DB connection error in /api/auth/me:', dbErr);
      return new Response(JSON.stringify({ user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const db = client.db();
    const users = db.collection('users');
  const { ObjectId } = require('mongodb');
  const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) return new Response(JSON.stringify({ user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  // sanitize
  const out = {
    id: user._id.toString(),
    email: user.email,
    company_name: user.company_name ?? null,
    contact_number: user.contact_number ?? null,
    allowed_trips: typeof user.allowed_trips === 'number' ? user.allowed_trips : null,
  };
    return new Response(JSON.stringify({ user: out }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
