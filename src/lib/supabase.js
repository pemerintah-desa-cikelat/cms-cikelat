// src/lib/supabase.js

import { createClient } from "@supabase/supabase-js";

// Ambil URL dan kunci Anon dari environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Inisialisasi klien Supabase sekali dan ekspor
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
