import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPortfolioTables() {
  console.log('Checking for portfolio-related tables in Supabase...\n');
  
  // List of potential portfolio table names
  const portfolioTableNames = [
    'portfolios',
    'portfolio',
    'portfolio_positions',
    'user_portfolios',
    'positions',
    'holdings',
    'investments',
    'assets',
    'securities',
    'stocks',
    'market_data',
    'watchlist',
    'transactions'
  ];
  
  const existingTables = [];
  
  for (const tableName of portfolioTableNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        existingTables.push(tableName);
        console.log(`✅ Found table: ${tableName}`);
        
        // Get count
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        console.log(`   Records: ${count || 0}`);
        
        // Show sample data if exists
        if (data && data.length > 0) {
          console.log(`   Sample:`, JSON.stringify(data[0], null, 2).substring(0, 200) + '...\n');
        }
      }
    } catch (e) {
      // Table doesn't exist, skip
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Found ${existingTables.length} portfolio-related tables:`, existingTables);
  
  // Check for specific portfolio data in any table
  if (existingTables.length > 0) {
    console.log('\n=== Checking for test portfolio data ===');
    
    for (const table of existingTables) {
      try {
        // Try different column names for user/portfolio identification
        const queries = [
          { column: 'user_id', value: 'test_user_1' },
          { column: 'portfolio_id', value: 'portfolio_1' },
          { column: 'userId', value: 'test_user_1' },
          { column: 'portfolioId', value: 'portfolio_1' }
        ];
        
        for (const query of queries) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq(query.column, query.value)
            .limit(5);
          
          if (!error && data && data.length > 0) {
            console.log(`\n📊 Found portfolio data in ${table} (${query.column}=${query.value}):`);
            console.log(JSON.stringify(data, null, 2));
            break;
          }
        }
      } catch (e) {
        // Skip errors
      }
    }
  }
}

checkPortfolioTables().catch(console.error);