// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Company types
export interface Company {
  id: string;
  name: string;
  email: string;
  password: string;
  contact_number?: string;
  // Maximum number of trips this company is allowed to create. If null/undefined => unlimited
  allowed_trips?: number | null;
  created_at: string;
  updated_at: string;
}

// Trip types
export interface Trip {
  id: string;
  company_id: string;
  from_city: string;
  to_city: string;
  bus_type: string;
  departure_time: string;
  contact_number?: string;
  price?: number;
  created_at: string;
  updated_at: string;
  company?: Company; // For joins
  // Additional properties for MapView
  company_name?: string;
  travel_time?: string;
}

// Trip form types
export interface TripFormData {
  from_city: string;
  to_city: string;
  bus_type: string;
  departure_time: string;
  contact_number?: string;
}

// Booking types
export interface Booking {
  id: string;
  trip_id: string;
  user_id: string;
  seats: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}
