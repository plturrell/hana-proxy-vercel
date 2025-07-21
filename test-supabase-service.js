import { createClient } from '@supabase/supabase-js';

// Use service role key for testing
const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk2NTEyMywiZXhwIjoyMDUwNTQxMTIzfQ.Kt9IU_wM7qO0B5cD6gJO8YS3mzgQoXm9vLgJj2hNnJY';

console.log('Testing Supabase connection with service role key...');
console.log('URL:', supabaseUrl);

async function testConnection() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
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