import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function listTables() {
  console.log('Listing all tables in the database...\n');
  
  // Direct query to list all tables
  const { data, error } = await supabase
    .from('a2a_agents')
    .select('agent_id')
    .limit(1);
    
  if (error) {
    console.log('Error accessing a2a_agents:', error.message);
  } else {
    console.log('✓ a2a_agents table exists');
  }
  
  // Check for ord table
  const { data: ordData, error: ordError } = await supabase
    .from('ord_analytics_resources') 
    .select('*')
    .limit(1);
    
  if (ordError) {
    console.log('✗ ord_analytics_resources table error:', ordError.message);
    
    // Check for alternative names
    const tables = [
      'ord_resources',
      'ord_registry',
      'analytics_resources',
      'resource_registry'
    ];
    
    for (const tableName of tables) {
      const { error: checkError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (!checkError) {
        console.log(`✓ Found table: ${tableName}`);
      }
    }
  } else {
    console.log('✓ ord_analytics_resources table exists');
    if (ordData && ordData.length > 0) {
      console.log('\nTable columns:');
      Object.keys(ordData[0]).forEach(col => {
        console.log(`  - ${col}`);
      });
    }
  }
  
  // Check comprehensive function registry
  const { data: funcData, error: funcError } = await supabase
    .from('comprehensive_function_registry')
    .select('*')
    .limit(1);
    
  if (!funcError) {
    console.log('✓ comprehensive_function_registry table exists');
  }
  
  // Raw SQL query to get all tables
  const { data: tableList, error: tableError } = await supabase.rpc('get_table_list', {});
  
  if (!tableError && tableList) {
    console.log('\nAll available tables:');
    tableList.forEach(table => console.log(`  - ${table}`));
  }
}

listTables().catch(console.error);