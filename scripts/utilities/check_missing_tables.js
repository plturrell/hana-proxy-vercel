const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRequiredTables() {
  console.log('Checking for required tables...\n');

  // List of tables the app expects
  const requiredTables = [
    'news_articles',
    'knowledge_entities', 
    'knowledge_relationships',
    'trending_topics',
    'user_interactions',
    'analytics_events',
    'user_sessions',
    'device_tokens',
    'cache_access_log',
    'user_profiles',
    'cache_knowledge',
    'knowledge_transfer_log',
    'market_data',
    'market_data_sources'
  ];

  const missingTables = [];
  const existingTables = [];

  for (const table of requiredTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log(`❌ Table '${table}' is MISSING`);
      missingTables.push(table);
    } else if (error) {
      console.log(`⚠️  Table '${table}' error: ${error.message}`);
    } else {
      console.log(`✅ Table '${table}' exists`);
      existingTables.push(table);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Existing tables: ${existingTables.length}`);
  console.log(`   Missing tables: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n❌ Missing tables that need to be created:');
    missingTables.forEach(table => console.log(`   - ${table}`));
  }
}

checkRequiredTables();