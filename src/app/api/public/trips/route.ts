import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase service key not configured on server' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const now = new Date();
    const nowIso = now.toISOString();
    // Also include trips that were just created (last 24 hours) to avoid
    // missing recently-added trips due to timezone differences or clock skew.
    const createdSince = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('trips')
      .select(`*, company:companies(id, name, contact_number)`)
      .or(`departure_time.gte.${nowIso},created_at.gte.${createdSince}`)
      .order('departure_time', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
