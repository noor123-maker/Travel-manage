import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase service key not configured on server' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    // Log a redacted snapshot of the incoming payload for production diagnostics
    try {
      const redacted = { ...body } as any;
      // remove any tokens or secrets if present
      if (redacted.token) redacted.token = '[REDACTED]';
      console.info('/api/trips incoming payload:', JSON.stringify(redacted));
    } catch (e) {
      // ignore logging errors
    }

    // Ensure arrival_time is set (DB enforces NOT NULL). Default to departure_time when missing.
    const payload: any = { ...(body || {}) };
    if (!payload.arrival_time) {
      payload.arrival_time = payload.departure_time ?? new Date().toISOString();
    }

    // Expect the client to pass the user's access token in Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing access token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Verify the token belongs to a valid user
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const user = userData.user;

    // Enforce that the company_id equals the authenticated user's id (same logic as client createTrip)
    // Ensure a matching company row exists. The trips.company_id FK references companies(id).
    // Many deployments expect the companies.id to match the authenticated user's id.
    // If no company exists for this user, create a lightweight company record using the user's id.
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

  if (!existingCompany) {
      // create a minimal company record with id equal to auth user id
      const companyName = (user.user_metadata && (user.user_metadata as any).company_name) || user.email || 'Company';
      // Generate a secure random password to satisfy NOT NULL constraint. This value is not used for auth here.
      const generatedPassword = randomBytes(16).toString('hex');
      const { error: createErr } = await supabaseAdmin.from('companies').insert({ id: user.id, name: companyName, email: user.email, password: generatedPassword, contact_number: (user.user_metadata && (user.user_metadata as any).contact_number) || null }).select();
      if (createErr) {
        // Log creation error for diagnostics
        console.error('/api/trips company creation error:', createErr);
        // If creating the company fails due to unique constraints or other issues, return the error
        return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const insertObj = { company_id: user.id, ...payload };

    const { data, error } = await supabaseAdmin.from('trips').insert(insertObj).select().single();
    if (error) {
      // Log the failed insert and return the message
      console.error('/api/trips insert error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Error in /api/trips POST:', err && err.stack ? err.stack : err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
