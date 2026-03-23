import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lkmlefvhubglztqxnorb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrbWxlZnZodWJnbHp0cXhub3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzA0NDQsImV4cCI6MjA4OTcwNjQ0NH0.4aFN-6cOF02le6s-3Hil0NeU_8pH49_sZjEOYxR9wJk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
