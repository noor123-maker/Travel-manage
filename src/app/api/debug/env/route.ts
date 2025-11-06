export async function GET() {
  try {
    const hasPublicUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasService = !!process.env.SUPABASE_SERVICE_KEY;

    return new Response(JSON.stringify({ hasPublicUrl, hasAnon, hasService }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
