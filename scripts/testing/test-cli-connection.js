import { createClient } from '@supabase/supabase-js';

// Use the correct project reference from .supabase/project-ref
const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo';

console.log('Testing Supabase connection with correct project reference...');
console.log('URL:', supabaseUrl);

async function testConnection() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test by querying agent_registry
    const { data, error } = await supabase
      .from('agent_registry')
      .select('id, name, type')
      .limit(3);
      
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Sample agents:', JSON.stringify(data, null, 2));
    
    // Test count
    const { count, error: countError } = await supabase
      .from('agent_registry')
      .select('*', { count: 'exact', head: true });
      
    if (!countError) {
      console.log(`Total agents in registry: ${count}`);
    }
    
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();