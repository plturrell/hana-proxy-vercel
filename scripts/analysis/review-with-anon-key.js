import { createClient } from '@supabase/supabase-js';

// Try with anon key first
const supabaseAnon = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjUxMjMsImV4cCI6MjA1MDU0MTEyM30.xY2FxBZmUgDW4mfKBTQYnJfJGYZeRHHIJhpb9iLXYEE'
);

// Try with service key
const supabaseService = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk2NTEyMywiZXhwIjoyMDUwNTQxMTIzfQ.Kt9IU_wM7qO0B5cD6gJO8YS3mzgQoXm9vLgJj2hNnJY'
);

async function testConnection() {
  console.log('🔍 TESTING SUPABASE CONNECTION');
  console.log('===============================\n');

  // Test basic connection with anon key
  console.log('📡 Testing with ANON key...');
  try {
    const { data, error } = await supabaseAnon.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`  ❌ Anon key error: ${error.message}`);
    } else {
      console.log(`  ✅ Anon key works - users table accessible`);
    }
  } catch (e) {
    console.log(`  ❌ Anon key failed: ${e.message}`);
  }

  // Test with service key
  console.log('\n🔧 Testing with SERVICE key...');
  try {
    const { data, error } = await supabaseService.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`  ❌ Service key error: ${error.message}`);
    } else {
      console.log(`  ✅ Service key works - users table accessible`);
    }
  } catch (e) {
    console.log(`  ❌ Service key failed: ${e.message}`);
  }

  // Try to list all tables using SQL
  console.log('\n📋 Trying to list all tables...');
  try {
    const { data, error } = await supabaseService.rpc('sql', {
      query: `
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
      `
    });
    
    if (error) {
      console.log(`  ❌ SQL query error: ${error.message}`);
    } else {
      console.log(`  ✅ Found ${data ? data.length : 0} tables`);
      if (data) {
        data.forEach(table => console.log(`    - ${table.tablename}`));
      }
    }
  } catch (e) {
    console.log(`  ❌ SQL query failed: ${e.message}`);
  }

  // Try alternative approach - check if any known tables exist
  console.log('\n🔍 Checking known tables individually...');
  const knownTables = ['users', 'agents', 'market_data', 'news_articles', 'a2a_agents'];
  
  for (const table of knownTables) {
    try {
      const { data, error } = await supabaseService
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`  ❌ ${table}: Table does not exist`);
        } else if (error.message.includes('permission')) {
          console.log(`  🔒 ${table}: Permission denied`);
        } else {
          console.log(`  ⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`  ✅ ${table}: Exists and accessible (${data.length} records shown)`);
        if (data.length > 0) {
          console.log(`    Columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`  ❌ ${table}: ${e.message}`);
    }
  }
}

testConnection().catch(console.error);