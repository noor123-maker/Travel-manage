import getClient from '@/lib/mongo';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/\btoken=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : null;
    if (!token) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const jwtModule = await import('jsonwebtoken');
    const jwt = (jwtModule as any).default || jwtModule;
    const secret = process.env.JWT_SECRET || 'changeme';
    let payload: any = null;
    try {
      payload = jwt.verify(token, secret);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const userId = payload?.sub;
    if (!userId) return new Response(JSON.stringify({ error: 'Invalid token payload' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const body = await req.json().catch(() => ({}));
  const { company_name, contact_number, currentPassword, newPassword, allowed_trips, signup_code } = body;

    let client;
    try {
      client = await getClient();
    } catch (dbErr: any) {
      console.error('DB connection error in auth update:', dbErr);
      return new Response(JSON.stringify({ error: dbErr?.message || 'Database connection error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const db = client.db();
    const users = db.collection('users');
    const { ObjectId } = require('mongodb');
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

  const update: any = {};
  if (typeof company_name === 'string') update.company_name = company_name || null;
  if (typeof contact_number === 'string') update.contact_number = contact_number || null;
    // If allowed_trips is being changed, require valid signup code
    if (typeof allowed_trips === 'number' || allowed_trips === null) {
      const existingAllowed = typeof user.allowed_trips === 'number' ? user.allowed_trips : null;
      const newAllowed = typeof allowed_trips === 'number' ? allowed_trips : null;
      if (existingAllowed !== newAllowed) {
        const expected = process.env.SIGNUP_CODE || 'Noru007';
        if (!signup_code || signup_code !== expected) {
          return new Response(JSON.stringify({ error: 'Invalid or missing signup code' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
      }
      update.allowed_trips = newAllowed;
    }

    // If changing password, require currentPassword and validate it
    if (newPassword) {
      if (!currentPassword) return new Response(JSON.stringify({ error: 'Current password required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      const ok = await bcrypt.compare(currentPassword, user.passwordHash || '');
      if (!ok) return new Response(JSON.stringify({ error: 'Current password is incorrect' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      update.passwordHash = hash;
    }

    if (Object.keys(update).length > 0) {
      await users.updateOne({ _id: new ObjectId(userId) }, { $set: update });
    }

    // return sanitized updated user
    const updated = await users.findOne({ _id: new ObjectId(userId) });
    const out = {
      id: updated._id.toString(),
      email: updated.email,
      company_name: updated.company_name ?? null,
      contact_number: updated.contact_number ?? null,
      allowed_trips: typeof updated.allowed_trips === 'number' ? updated.allowed_trips : null,
    };

    return new Response(JSON.stringify({ ok: true, user: out }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ error: 'Method GET not allowed. Use POST to update profile.' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
