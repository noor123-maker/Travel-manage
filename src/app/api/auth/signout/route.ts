export async function POST() {
  // Clear the token cookie (fallback auth)
  const res = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  // expire cookie
  res.headers.set('Set-Cookie', `token=deleted; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`);
  return res;
}

export async function GET() {
  return new Response(JSON.stringify({ error: 'Method GET not allowed. Use POST to sign out.' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
