-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create companies table
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  contact_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trips table
CREATE TABLE trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  bus_type TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
  contact_number TEXT,
  price DECIMAL(10,2),
  available_seats INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_trips_company_id ON trips(company_id);
CREATE INDEX idx_trips_departure_time ON trips(departure_time);
CREATE INDEX idx_trips_from_to_city ON trips(from_city, to_city);

-- Enable Row Level Security on tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create policies for companies table
CREATE POLICY "Companies can view their own data" ON companies
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Companies can update their own data" ON companies
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for trips table
CREATE POLICY "Companies can view their own trips" ON trips
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Companies can insert their own trips" ON trips
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Companies can update their own trips" ON trips
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Companies can delete their own trips" ON trips
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM companies WHERE auth.uid()::text = id::text
    )
  );

-- Allow public to view trips (for browse page)
CREATE POLICY "Public can view trips" ON trips
  FOR SELECT USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
