import getClient from '@/lib/mongo';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
  const { email, password, signupCode, company_name, contact_number, allowed_trips } = await req.json();
  if (!email || !password) return new Response(JSON.stringify({ error: 'Missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    // basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // validate signup code (simple invite/static code). Set SIGNUP_CODE in env for production.
    const expected = process.env.SIGNUP_CODE || 'Noru007';
    if (!signupCode || signupCode !== expected) return new Response(JSON.stringify({ error: 'Invalid signup code' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

    let client;
    try {
      client = await getClient();
    } catch (dbErr: any) {
      console.error('DB connection error in signup:', dbErr);
      return new Response(JSON.stringify({ error: dbErr?.message || 'Database connection error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const db = client.db();
    const users = db.collection('users');

    const existing = await users.findOne({ email: email.toLowerCase() });
  if (existing) return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user and mark as verified immediately (signupCode requirement replaces email verification)
    // allowed_trips is optional; store null when absent => unlimited
    const allowedTripsValue = typeof allowed_trips === 'number' ? allowed_trips : null;
    await users.insertOne({
      email: email.toLowerCase(),
      passwordHash: hash,
      verified: true,
      company_name: company_name || null,
      contact_number: contact_number || null,
      allowed_trips: allowedTripsValue,
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ error: 'Method GET not allowed. Use POST to create a user.' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
