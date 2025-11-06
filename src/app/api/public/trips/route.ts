import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase service key not configured on server' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('trips')
      .select(`*, company:companies(id, name, contact_number)`)
      .gte('departure_time', now)
      .order('departure_time', { ascending: true });

    if (error) {
      console.error('/api/public/trips supabase error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Log count for diagnostics
    try { console.info(`/api/public/trips returning ${Array.isArray(data) ? data.length : 0} rows`); } catch {}

    return new Response(JSON.stringify(data || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('/api/public/trips error:', err && err.stack ? err.stack : err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
