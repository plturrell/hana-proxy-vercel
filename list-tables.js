import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo';

console.log('Listing tables in Supabase...');

async function listTables() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try common table names
    const commonTables = [
      'users', 'profiles', 'posts', 'comments',
      'agent_registry', 'agents', 'functions',
      'news', 'market_data', 'analytics'
    ];
    
    console.log('Checking common table names...\n');
    
    for (const table of commonTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (!error) {
        console.log(`✅ Table "${table}" exists`);
      }
    }
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

listTables();