import { createClient } from '@supabase/supabase-js';

/**
 * DELETE /api/admin/companies/:id
 *
 * Deletes a company and (via FK cascade) its trips.
 * Security: requires an admin secret header `x-admin-secret` that matches
 * process.env.ADMIN_SECRET. The route uses SUPABASE_SERVICE_KEY (service role)
 * to perform the deletion.
 */
export async function DELETE(req: any, context: any) {
  try {
    // normalize params (Next may provide params or Promise<params>)
    const maybeParams = context?.params;
    const params = maybeParams && typeof maybeParams.then === 'function' ? await maybeParams : maybeParams;
    const adminSecret = req.headers.get('x-admin-secret') || '';
    if (!process.env.ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'ADMIN_SECRET not configured on server' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

  const companyId = params?.id;
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'Missing company id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase service key not configured on server' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Delete the company. trips should cascade if DB uses ON DELETE CASCADE.
    const { error } = await supabaseAdmin.from('companies').delete().eq('id', companyId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, id: companyId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Error in /api/admin/companies/[id] DELETE:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
