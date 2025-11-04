# 🗄️ Supabase Setup Guide

## The Issue
The "Failed to fetch trips" error occurs because Supabase is not configured. The app is trying to connect to a database that doesn't exist.

## Quick Fix (Sample Data)
The app now includes **sample data** that will display when Supabase is not configured, so you can see the app working immediately!

## Full Setup (Optional)

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready

### 2. Get Your Credentials
1. Go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key

### 3. Update Environment Variables
Edit `.env.local` file and replace the placeholder values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Mapbox API Token (for maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token-here
```

### 4. Set Up Database Schema
Run the SQL from `supabase-schema.sql` in your Supabase SQL editor:

```sql
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
  available_seats INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Companies can view their own data" ON companies
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Anyone can view trips" ON trips
  FOR SELECT USING (true);

CREATE POLICY "Companies can manage their own trips" ON trips
  FOR ALL USING (auth.uid() = company_id);
```

## Current Status
✅ **App works with sample data** - No setup required!  
✅ **Contact numbers display** - All features functional  
✅ **Map view works** - Just add Mapbox token  
✅ **Multi-language support** - All translations included  

## Test the App
1. Go to `http://localhost:3000/browse`
2. You should see 3 sample trips with contact numbers
3. Click "🗺️ View Map" to see the map feature
4. Click "📞 Call Now" to test phone dialing

The app is fully functional with sample data! 🎉
