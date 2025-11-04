# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy your Project URL and anon/public key
5. Replace the values in `.env.local`

## Database Setup

Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor to create the required tables.

