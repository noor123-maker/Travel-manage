# Bus Travel Manager - Setup Instructions

## Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

### 2. Run Database Schema
1. Copy the contents of `supabase-schema.sql`
2. Go to your Supabase project dashboard
3. Navigate to SQL Editor
4. Paste and run the SQL schema

### 3. Environment Variables
Create a `.env.local` file in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features Implemented

### Database Tables
- **companies**: id, name, email, password, contact_number
- **trips**: id, company_id, from_city, to_city, bus_type, departure_time, arrival_time, contact_number, price, available_seats

### CRUD Operations
- ✅ Create trips
- ✅ Read trips (company-specific and public)
- ✅ Update trips
- ✅ Delete trips

### Pages
- ✅ `/` - Landing page
- ✅ `/login` - Company authentication
- ✅ `/dashboard` - Protected company dashboard with trip management
- ✅ `/browse` - Public trip browsing

### Security
- Row Level Security (RLS) enabled
- Companies can only manage their own trips
- Public can view all trips
- Authentication required for dashboard access

## Next Steps
1. Set up your Supabase project and environment variables
2. Test the CRUD operations in the dashboard
3. Add booking functionality
4. Implement user authentication for customers
5. Add payment processing
