import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Server action to delete a company. Runs on the server and uses the
// SUPABASE_SERVICE_KEY. WARNING: this page is not access-controlled by
// default. Protect it using middleware, Vercel access control, or add an
// authentication layer before deploying to production.
export async function deleteCompany(formData: FormData) {
  'use server';
  const id = formData.get('id') as string | null;
  if (!id) throw new Error('Missing company id');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase service key not configured on server');

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { error } = await supabaseAdmin.from('companies').delete().eq('id', id);
  if (error) throw new Error(error.message);

  // Revalidate the page so the deleted company disappears
  revalidatePath('/admin/companies');
}

export default async function AdminCompaniesPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold">Admin - Companies</h2>
        <p className="mt-4 text-red-400">SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_URL not configured on the server.</p>
      </div>
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: companies, error } = await supabaseAdmin.from('companies').select('*').order('created_at', { ascending: false });
  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold">Admin - Companies</h2>
        <p className="mt-4 text-red-400">Failed to fetch companies: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Admin — Companies</h2>
      <p className="mt-2 text-sm text-yellow-300">Warning: this admin page is not access-restricted by default. Protect it in production.</p>

      <div className="mt-6">
        <table className="min-w-full table-auto text-left">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies && companies.length > 0 ? (
              companies.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.contact_number || '-'}</td>
                  <td className="px-4 py-3">{new Date(c.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <form action={deleteCompany} method="post" onSubmit={(e) => { if (!confirm('Delete company and all its trips? This cannot be undone.')) { e.preventDefault(); } }}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4">No companies found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
