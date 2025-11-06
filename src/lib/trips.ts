import { supabase } from './supabaseClient';
import { Trip, TripFormData } from '@/types';
import * as companyStorage from './companyStorage';

// Helper: derive the current demo company from sessionStorage or /api/auth/me
async function deriveDemoCompany(): Promise<any /* StoredCompany | null */> {
  if (typeof window === 'undefined') return null;

  let stored = sessionStorage.getItem('currentCompany');
  let company = stored ? JSON.parse(stored) : null;

  if (company) return company;

  try {
    const r = await fetch('/api/auth/me', { credentials: 'include' });
    const txt = await r.text();
    let data: any = null;
    try { data = txt ? JSON.parse(txt) : null; } catch {}
    const user = data?.user ?? null;
    if (!user) return null;

    const companies = companyStorage.getAllCompanies();
    let found = companies.find((c: any) => c.email === user.email || c.id === user.id || c.name === user.company_name);
    if (!found) {
      try {
        found = companyStorage.createCompany({
          name: user.company_name || user.email,
          email: user.email,
          contact_number: user.contact_number || '',
          password: '',
          allowed_trips: typeof user.allowed_trips === 'number' ? user.allowed_trips : null,
        });
      } catch (e) {
        // ignore creation errors
      }
    }

    if (found) {
      sessionStorage.setItem('currentCompany', JSON.stringify(found));
      return found;
    }
  } catch (e) {
    // ignore
  }

  return null;
}

// Return trips grouped by company for the browse page. Uses Supabase when configured,
// otherwise falls back to client-side companyStorage.
export async function getTripsGroupedByCompany(): Promise<Array<{ name: string; contact_number?: string; trips: Trip[] }>> {
  if (!supabase) {
    // companyStorage provides the grouped shape synchronously; adapt to our return type
    const grouped = companyStorage.getTripsGroupedByCompany();
    // stored trips are StoredTrip[] which is compatible with Trip for display purposes
    return grouped.map(g => ({ name: g.name, contact_number: g.contact_number, trips: g.trips as unknown as Trip[] }));
  }

  // When Supabase is available, fetch all upcoming trips and group by their company
  const all = await getAllTrips();
  const map = new Map<string, { name: string; contact_number?: string; trips: Trip[] }>();
  for (const trip of all) {
    const company = (trip as any).company as any | undefined;
    const companyId = company?.id || trip.company_id || (trip.company_name ?? 'unknown');
    const name = company?.name || trip.company_name || 'Unknown Company';
    const contact = company?.contact_number || (trip as any).contact_number || undefined;
    if (!map.has(companyId)) {
      map.set(companyId, { name, contact_number: contact, trips: [] });
    }
    map.get(companyId)!.trips.push(trip);
  }

  return Array.from(map.values());
}

// Get all trips for the current company
export async function getCompanyTrips(): Promise<Trip[]> {
  if (!supabase) {
    // Supabase not configured — for demo mode we should return ONLY the trips
    // that belong to the currently signed-in demo company (if any). Previously
    // this returned global sample trips which meant new companies saw random
    // example trips. The user requested that newly signed-up companies start
    // with zero trips so they can add their own.
    console.warn('Supabase not configured, using demo company storage');

    if (typeof window === 'undefined') {
      return [];
    }

    // Try sessionStorage first (other code sets currentCompany there)
    let stored = sessionStorage.getItem('currentCompany');
    let company: any = stored ? JSON.parse(stored) : null;

    // If not in sessionStorage, attempt to derive from our fallback auth (/api/auth/me)
    if (!company) {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        const txt = await r.text();
        let data: any = null;
        try { data = txt ? JSON.parse(txt) : null; } catch {}
        const user = data?.user ?? null;
        if (user && user.email) {
          const companies = companyStorage.getAllCompanies();
          let found = companies.find((c: any) => c.email === user.email || c.id === user.id || c.name === user.company_name);
          if (!found) {
            // create an empty demo company record for this user (no trips created)
            try {
              found = companyStorage.createCompany({
                name: user.company_name || user.email,
                email: user.email,
                contact_number: user.contact_number || '',
                password: '',
                allowed_trips: typeof user.allowed_trips === 'number' ? user.allowed_trips : null,
              });
            } catch (e) {
              // ignore creation errors
            }
          }
          if (found) {
            company = found;
            sessionStorage.setItem('currentCompany', JSON.stringify(company));
          }
        }
      } catch (e) {
        // ignore fetch errors — we'll fall through to returning an empty list
      }
    }

    if (!company) {
      // No authenticated demo company -> return empty list (no sample trips)
      return [];
    }

    // Return only trips that belong to this demo company
    try {
      const storedTrips = companyStorage.getTripsByCompany(company.id || '');
      return storedTrips as unknown as Trip[];
    } catch (e) {
      console.warn('Failed to read demo trips, returning empty list', e);
      return [];
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('company_id', user.id)
    .order('departure_time', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch trips: ${error.message}`);
  }

  return data || [];
}

// Get all trips (for browse page)
export async function getAllTrips(): Promise<Trip[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning sample data');
    return getSampleTrips();
  }
  // Use a server-side endpoint to fetch trips joined with company info.
  // Client-side anonymous Supabase queries are blocked from reading `companies`
  // by Row Level Security; the server endpoint uses the service role key to
  // return company names for the public browse page.
  try {
    const res = await fetch('/api/public/trips');
    const txt = await res.text();
    let json: any = null;
    try { json = txt ? JSON.parse(txt) : null; } catch {}
    if (!res.ok) {
      console.warn('Server /api/public/trips returned error, falling back to sample trips', json || txt);
      return getSampleTrips();
    }

    return json || [];
  } catch (err) {
    console.warn('Failed to fetch public trips endpoint, returning sample data:', err);
    return getSampleTrips();
  }
}

// Create a new trip
export async function createTrip(tripData: TripFormData): Promise<Trip> {
  if (!supabase) {
    // fallback to local company storage (client-side localStorage)
    if (typeof window === 'undefined') {
      throw new Error('Supabase not configured and no client-side storage available.');
    }

    let stored = sessionStorage.getItem('currentCompany');
    let company = stored ? JSON.parse(stored) : null;

    // If no currentCompany in sessionStorage, try to derive it from our fallback auth (/api/auth/me)
    if (!company) {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        const txt = await r.text();
        let data: any = null;
        try { data = txt ? JSON.parse(txt) : null; } catch {}
        const user = data?.user ?? null;
        if (user && user.email) {
          // find existing company by email
          const companies = companyStorage.getAllCompanies();
          let found = companies.find((c: any) => c.email === user.email);
          if (!found) {
            // create a demo company record for this user
            try {
              found = companyStorage.createCompany({
                name: user.company_name || user.email,
                email: user.email,
                contact_number: user.contact_number || '',
                password: '',
              });
            } catch (e) {
              // if creation fails for any reason, ignore and leave found null
            }
          }
          if (found) {
            company = found;
            sessionStorage.setItem('currentCompany', JSON.stringify(company));
          }
        }
      } catch (e) {
        // ignore fetch errors
      }
    }

    if (!company) throw new Error('No company logged in (sample mode)');
    // Enforce allowed_trips quota for demo companies (null or undefined -> unlimited)
    try {
      const companyAllowed = (company.allowed_trips ?? null) as number | null;
      if (typeof companyAllowed === 'number') {
        const existing = companyStorage.getTripsByCompany(company.id || '');
        if (existing.length >= companyAllowed) {
          throw new Error(`Trip limit reached: allowed ${companyAllowed}`);
        }
      }
    } catch (e) {
      // If storage helpers fail for any reason, surface a readable error
      if ((e as any)?.message && (e as any).message.includes('Trip limit reached')) {
        throw e;
      }
      // otherwise ignore and continue
    }

    const newTrip = companyStorage.createTrip({
      company_id: company.id,
      from_city: tripData.from_city,
      to_city: tripData.to_city,
      bus_type: tripData.bus_type,
      departure_time: tripData.departure_time,
      contact_number: tripData.contact_number,
    });

    return newTrip as unknown as Trip;
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  // Prefer creating trips via a secure server API that uses the service role key
  // This avoids row-level security policy failures when using client-side anon keys
  try {
    // Attempt to get session token so we can forward it to the server API
    let token: string | null = null;
    try {
      const s = await (supabase as any).auth.getSession();
      token = s?.data?.session?.access_token ?? null;
    } catch (e) {
      // ignore
    }

    if (token) {
      // prepare body: ensure arrival_time exists to satisfy DB NOT NULL
      const sendBody: any = { ...tripData };
      if (!sendBody.arrival_time) sendBody.arrival_time = sendBody.departure_time ?? new Date().toISOString();

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(sendBody),
      });
      const txt = await res.text();
      let json: any = null;
      try { json = txt ? JSON.parse(txt) : null; } catch {}
      if (!res.ok) {
        throw new Error(json?.error || txt || `Server returned ${res.status}`);
      }
      return json;
    }

    // Fallback to direct client-side insert (may fail if RLS policies require different checks)
    const { data, error } = await supabase
      .from('trips')
      .insert({
        company_id: user.id,
        ...tripData
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create trip: ${error.message}`);
    }

    return data;
  } catch (err: any) {
    // normalize error
    throw new Error(err?.message || String(err));
  }
}

// Update an existing trip
export async function updateTrip(tripId: string, tripData: Partial<TripFormData>): Promise<Trip> {
  if (!supabase) {
    if (typeof window === 'undefined') {
      throw new Error('Supabase not configured and no client-side storage available.');
    }

    // Derive current demo company (same logic as createTrip)
    let stored = sessionStorage.getItem('currentCompany');
    let company = stored ? JSON.parse(stored) : null;
    if (!company) {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        const txt = await r.text();
        let data: any = null;
        try { data = txt ? JSON.parse(txt) : null; } catch {}
        const user = data?.user ?? null;
        if (user && user.email) {
          const companies = companyStorage.getAllCompanies();
          let found = companies.find((c: any) => c.email === user.email || c.id === user.id || c.name === user.company_name);
          if (!found) {
            try {
              found = companyStorage.createCompany({
                name: user.company_name || user.email,
                email: user.email,
                contact_number: user.contact_number || '',
                password: '',
                allowed_trips: typeof user.allowed_trips === 'number' ? user.allowed_trips : null,
              });
            } catch (e) {}
          }
          if (found) {
            company = found;
            sessionStorage.setItem('currentCompany', JSON.stringify(company));
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (!company) throw new Error('No company logged in (sample mode)');

    // Ensure ownership: trip must belong to this demo company
    const allTrips = companyStorage.getAllTrips();
    const trip = allTrips.find(t => t.id === tripId);
    if (!trip) throw new Error('Trip not found');
    if (trip.company_id !== company.id) throw new Error('Not authorized to update this trip');

    // Use local storage update
    const updated = companyStorage.updateTrip(tripId, tripData as any);
    return updated as unknown as Trip;
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('trips')
    .update(tripData)
    .eq('id', tripId)
    .eq('company_id', user.id) // Ensure user can only update their own trips
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update trip: ${error.message}`);
  }

  return data;
}

// Delete a trip
export async function deleteTrip(tripId: string): Promise<void> {
  if (!supabase) {
    if (typeof window === 'undefined') {
      throw new Error('Supabase not configured and no client-side storage available.');
    }

    // Derive current demo company
    let stored = sessionStorage.getItem('currentCompany');
    let company = stored ? JSON.parse(stored) : null;
    if (!company) {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        const txt = await r.text();
        let data: any = null;
        try { data = txt ? JSON.parse(txt) : null; } catch {}
        const user = data?.user ?? null;
        if (user && user.email) {
          const companies = companyStorage.getAllCompanies();
          let found = companies.find((c: any) => c.email === user.email || c.id === user.id || c.name === user.company_name);
          if (found) {
            company = found;
            sessionStorage.setItem('currentCompany', JSON.stringify(company));
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (!company) throw new Error('No company logged in (sample mode)');

    // Ownership check
    const allTrips = companyStorage.getAllTrips();
    const trip = allTrips.find(t => t.id === tripId);
    if (!trip) throw new Error('Trip not found');
    if (trip.company_id !== company.id) throw new Error('Not authorized to delete this trip');

    companyStorage.deleteTrip(tripId);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId)
    .eq('company_id', user.id); // Ensure user can only delete their own trips

  if (error) {
    throw new Error(`Failed to delete trip: ${error.message}`);
  }
}

// Get a single trip by ID
export async function getTripById(tripId: string): Promise<Trip | null> {
  if (!supabase) {
    // In sample data mode, find the trip by ID and ensure a matching demo company exists
    const sampleTrips = getSampleTrips();
    const sample = sampleTrips.find(s => s.id === tripId) || null;
    if (!sample) return null;

    // If the sample has an embedded company, ensure it's present in our companyStorage so
    // downstream code that expects a company record will work (this mirrors fallback logic).
    const sampleCompany = (sample as any).company as any | undefined;
    if (sampleCompany) {
      try {
        const existingCompanies = companyStorage.getAllCompanies();
        let company = existingCompanies.find((c: any) => c.id === sampleCompany.id || c.email === sampleCompany.email || c.name === sampleCompany.name);
        if (!company) {
          company = companyStorage.createCompany({
            name: sampleCompany.name || `${sampleCompany.id}`,
            email: sampleCompany.email || `${sampleCompany.id}@local`,
            contact_number: sampleCompany.contact_number || '',
            password: '',
          });
        }
        // attach minimal company_name if missing on the trip
        (sample as any).company_name = (sample as any).company_name || company.name;
      } catch (e) {
        // ignore storage errors in demo mode
      }
    }

    return sample;
  }

  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      company:companies(name, contact_number)
    `)
    .eq('id', tripId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Trip not found
    }
    throw new Error(`Failed to fetch trip: ${error.message}`);
  }

  return data;
}

// Sample trips data for when Supabase is not configured
function getSampleTrips(): Trip[] {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  
  return [
    // Afghan Express Company
    {
      id: '1',
      company_id: 'company-1',
      from_city: 'Herat',
      to_city: 'Kandahar',
      bus_type: 'VIP',
      departure_time: tomorrow.toISOString(),
  // arrival_time removed
      contact_number: '+93 70 123 4567',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      company: {
        id: 'company-1',
        name: 'Afghan Express',
        email: 'info@afghanexpress.com',
        password: '',
        contact_number: '+93 70 123 4567',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    },
    {
      id: '2',
      company_id: 'company-1',
      from_city: 'Kabul',
      to_city: 'Herat',
      bus_type: '580 Bus',
      departure_time: dayAfter.toISOString(),
  // arrival_time removed
      contact_number: '+93 70 123 4567',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      company: {
        id: 'company-1',
        name: 'Afghan Express',
        email: 'info@afghanexpress.com',
        password: '',
        contact_number: '+93 70 123 4567',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    },
    {
      id: '3',
      company_id: 'company-1',
      from_city: 'Herat',
      to_city: 'Farah',
      bus_type: 'VIP',
      departure_time: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
  // arrival_time removed
      contact_number: '+93 70 123 4567',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      company: {
        id: 'company-1',
        name: 'Afghan Express',
        email: 'info@afghanexpress.com',
        password: '',
        contact_number: '+93 70 123 4567',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    },
    // Kabul Transport Company
    {
      id: '4',
      company_id: 'company-2',
      from_city: 'Kabul',
      to_city: 'Kandahar',
      bus_type: '580 Bus',
      departure_time: tomorrow.toISOString(),
  // arrival_time removed
      contact_number: '+93 70 234 5678',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      company: {
        id: 'company-2',
        name: 'Kabul Transport',
        email: 'info@kabultransport.com',
        password: '',
        contact_number: '+93 70 234 5678',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    },
    {
      id: '5',
      company_id: 'company-2',
      from_city: 'Kandahar',
      to_city: 'Nimroz',
      bus_type: 'VIP',
      departure_time: dayAfter.toISOString(),
  // arrival_time removed
      contact_number: '+93 70 234 5678',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      company: {
        id: 'company-2',
        name: 'Kabul Transport',
        email: 'info@kabultransport.com',
        password: '',
        contact_number: '+93 70 234 5678',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    },
    // Western Routes Company
    {
      id: '6',
      company_id: 'company-3',
      from_city: 'Herat',
      to_city: 'Nimroz',
      bus_type: '580 Bus',
      departure_time: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000).toISOString(),
  // arrival_time removed
      contact_number: '+93 70 345 6789',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      company: {
        id: 'company-3',
        name: 'Western Routes',
        email: 'info@westernroutes.com',
        password: '',
        contact_number: '+93 70 345 6789',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    },
    {
      id: '7',
      company_id: 'company-3',
      from_city: 'Farah',
      to_city: 'Kabul',
      bus_type: 'VIP',
      departure_time: new Date(dayAfter.getTime() + 1 * 60 * 60 * 1000).toISOString(),
  // arrival_time removed
      contact_number: '+93 70 345 6789',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      company: {
        id: 'company-3',
        name: 'Western Routes',
        email: 'info@westernroutes.com',
        password: '',
        contact_number: '+93 70 345 6789',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    }
  ];
}