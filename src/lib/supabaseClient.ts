import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseUrl !== 'your_supabase_url_here' && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseAnonKey !== 'placeholder-key'

let supabase: any = null

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Failed to create Supabase client:', error)
    supabase = null
  }
} else {
  console.warn('Supabase not configured, using sample data mode')
}

export { supabase }
