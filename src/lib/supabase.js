import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-ref'),
)

if (!isSupabaseConfigured) {
  console.warn(
    import.meta.env.PROD
      ? 'Supabase env vars missing at build time. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Environment Variables, then Redeploy.'
      : 'Supabase env vars missing. Put VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env at the project root, then restart npm run dev.',
  )
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
