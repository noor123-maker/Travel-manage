import { Company, Trip } from '@/types';

// Company storage using localStorage
const COMPANIES_KEY = 'bus_companies';
const TRIPS_KEY = 'bus_trips';

export interface StoredCompany extends Company {
  password: string; // Store password for demo purposes
  // Allow null to represent unlimited in demo mode
  allowed_trips?: number | null;
}

export interface StoredTrip extends Trip {
  company_name: string;
}

// Company management functions
export function getAllCompanies(): StoredCompany[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(COMPANIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading companies:', error);
    return [];
  }
}

export function getCompanyByEmail(email: string): StoredCompany | null {
  const companies = getAllCompanies();
  return companies.find(company => company.email === email) || null;
}

export function createCompany(companyData: Omit<StoredCompany, 'id' | 'created_at' | 'updated_at'>): StoredCompany {
  const companies = getAllCompanies();
  
  // Check if email already exists
  if (companies.some(c => c.email === companyData.email)) {
    throw new Error('Company with this email already exists');
  }
  
  const newCompany: StoredCompany = {
    ...companyData,
    id: `company-${Date.now()}`,
    // if allowed_trips is not provided, treat as unlimited (null)
    allowed_trips: typeof companyData.allowed_trips === 'number' ? companyData.allowed_trips : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  companies.push(newCompany);
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
  
  return newCompany;
}

export function authenticateCompany(email: string, password: string): StoredCompany | null {
  const company = getCompanyByEmail(email);
  if (company && company.password === password) {
    return company;
  }
  return null;
}

// Trip management functions
export function getAllTrips(): StoredTrip[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(TRIPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading trips:', error);
    return [];
  }
}

export function getTripsByCompany(companyId: string): StoredTrip[] {
  const trips = getAllTrips();
  return trips.filter(trip => trip.company_id === companyId);
}

export function createTrip(tripData: Omit<StoredTrip, 'id' | 'created_at' | 'updated_at' | 'company_name'>): StoredTrip {
  const trips = getAllTrips();
  const companies = getAllCompanies();
  const company = companies.find(c => c.id === tripData.company_id);
  
  if (!company) {
    throw new Error('Company not found');
  }
  
  const newTrip: StoredTrip = {
    ...tripData,
    id: `trip-${Date.now()}`,
    company_name: company.name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  trips.push(newTrip);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  
  return newTrip;
}

export function updateTrip(tripId: string, tripData: Partial<Omit<StoredTrip, 'id' | 'created_at' | 'updated_at' | 'company_name'>>): StoredTrip {
  const trips = getAllTrips();
  const tripIndex = trips.findIndex(trip => trip.id === tripId);
  
  if (tripIndex === -1) {
    throw new Error('Trip not found');
  }
  
  trips[tripIndex] = {
    ...trips[tripIndex],
    ...tripData,
    updated_at: new Date().toISOString(),
  };
  
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  return trips[tripIndex];
}

export function deleteTrip(tripId: string): void {
  const trips = getAllTrips();
  const filteredTrips = trips.filter(trip => trip.id !== tripId);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(filteredTrips));
}

// Get trips grouped by company for browse page
export function getTripsGroupedByCompany(): Array<{
  name: string;
  contact_number?: string;
  trips: StoredTrip[];
}> {
  const trips = getAllTrips();
  const companies = getAllCompanies();
  
  const companyMap = new Map<string, {
    name: string;
    contact_number?: string;
    trips: StoredTrip[];
  }>();
  
  trips.forEach(trip => {
    // Try to find a matching company by id
    let company = companies.find(c => c.id === trip.company_id);

    if (company) {
      if (!companyMap.has(company.id)) {
        companyMap.set(company.id, {
          name: company.name,
          contact_number: company.contact_number,
          trips: []
        });
      }
      companyMap.get(company.id)!.trips.push(trip);
      return;
    }

    // If no company record exists (possible with older/demo trips), group by the trip's company_name
    const fallbackKey = trip.company_id || trip.company_name || `unknown-${trip.id}`;
    const fallbackName = trip.company_name || 'Unknown Company';
    if (!companyMap.has(fallbackKey)) {
      companyMap.set(fallbackKey, {
        name: fallbackName,
        contact_number: trip.contact_number || undefined,
        trips: []
      });
    }
    companyMap.get(fallbackKey)!.trips.push(trip);
  });
  
  return Array.from(companyMap.values());
}
