import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkSchema() {
  console.log('Checking ord_analytics_resources table structure...\n');
  
  // First check if table exists using a simple query
  try {
    const { data: testData, error: testError } = await supabase
      .from('ord_analytics_resources')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.log('Table might not exist or has issues:', testError.message);
      
      // Try to get all tables to see what exists
      const { data: allTables, error: allTablesError } = await supabase
        .rpc('get_tables', { schema_name: 'public' })
        .select('*');
        
      if (!allTablesError && allTables) {
        console.log('\nAvailable tables in public schema:');
        allTables.forEach(table => console.log(`  - ${table.table_name}`));
      }
      
      // Check if there's a similar table name
      const { data: ordTables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%ord%');
        
      if (ordTables && ordTables.length > 0) {
        console.log('\nTables containing "ord":');
        ordTables.forEach(t => console.log(`  - ${t.table_name}`));
      }
      
      return;
    }
    
    console.log('Table exists. Sample data structure:');
    if (testData && testData.length > 0) {
      console.log('\nColumns found:');
      Object.keys(testData[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof testData[0][key]}`);
      });
      
      console.log('\nSample row:');
      console.log(JSON.stringify(testData[0], null, 2));
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
  
  // Also check a2a_agents table
  console.log('\n\nChecking a2a_agents table structure...');
  const { data: agentData, error: agentError } = await supabase
    .from('a2a_agents')
    .select('*')
    .limit(1);
    
  if (!agentError && agentData && agentData.length > 0) {
    console.log('\nColumns found:');
    Object.keys(agentData[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof agentData[0][key]}`);
    });
  }
}

checkSchema().catch(console.error);