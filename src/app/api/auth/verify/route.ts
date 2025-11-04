import getClient from '@/lib/mongo';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return new Response(JSON.stringify({ error: 'Missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    let client;
    try {
      client = await getClient();
    } catch (dbErr: any) {
      console.error('DB connection error in verify:', dbErr);
      return new Response(JSON.stringify({ error: dbErr?.message || 'Database connection error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const db = client.db();
    const users = db.collection('users');

    const user = await users.findOne({ email: email.toLowerCase() });
  if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  if (user.verified) return new Response(JSON.stringify({ error: 'Already verified' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (user.verificationCode !== code) return new Response(JSON.stringify({ error: 'Invalid code' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (new Date(user.verificationExpires) < new Date()) return new Response(JSON.stringify({ error: 'Code expired' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    await users.updateOne({ _id: user._id }, { $set: { verified: true }, $unset: { verificationCode: '', verificationExpires: '' } });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
