// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mbgelqfanullibsqzlzs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZ2VscWZhbnVsbGlic3F6bHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODAwMDgsImV4cCI6MjA2NzM1NjAwOH0.CF8PVcgc32T2yJCpms8cyBih1b9Iep0g7fhhmNRcXMQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});