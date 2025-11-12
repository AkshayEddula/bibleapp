import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lqntavwunhkfnecpgflo.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbnRhdnd1bmhrZm5lY3BnZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NDczMjksImV4cCI6MjA3ODMyMzMyOX0.W5hZqKqqlZ2ssPDpu0Ul1fKgop08NXnwBN892PZN9nk";
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
