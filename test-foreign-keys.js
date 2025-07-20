import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function testForeignKeyRelationships() {
  console.log('🔗 FOREIGN KEY RELATIONSHIPS VERIFICATION');
  console.log('=========================================\n');

  // Method 1: Direct pg_constraint query
  try {
    const { data: pgData, error: pgError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            tc.table_name as table_name,
            tc.constraint_name as constraint_name,
            ccu.table_name as foreign_table_name,
            ccu.column_name as foreign_column_name,
            kcu.column_name as column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
          ORDER BY tc.table_name, tc.constraint_name;
        `
      });

    if (!pgError && pgData) {
      console.log('📊 FOREIGN KEY CONSTRAINTS FOUND:');
      console.log(`Total: ${pgData.length}`);
      console.log('');
      
      pgData.forEach(fk => {
        console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
      
      return pgData.length;
    }
  } catch (e) {
    console.log('Method 1 failed:', e.message);
  }

  // Method 2: Try direct pg_catalog queries
  try {
    const { data: catalogData, error: catalogError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
          FROM pg_indexes 
          WHERE schemaname = 'public'
            AND indexdef LIKE '%REFERENCES%'
          ORDER BY tablename;
        `
      });

    if (!catalogError && catalogData) {
      console.log('📋 REFERENCE INDEXES:');
      catalogData.forEach(idx => {
        console.log(`  ${idx.tablename}: ${idx.indexdef}`);
      });
    }
  } catch (e) {
    console.log('Method 2 failed:', e.message);
  }

  // Method 3: Test actual relationships by attempting queries
  console.log('\n🧪 TESTING ACTUAL RELATIONSHIPS:');
  
  const relationshipTests = [
    {
      name: 'portfolio_holdings → users',
      query: `
        SELECT ph.symbol, u.username 
        FROM portfolio_holdings ph 
        JOIN users u ON ph.user_id = u.id 
        LIMIT 1
      `
    },
    {
      name: 'agents → users', 
      query: `
        SELECT a.name, u.username 
        FROM agents a 
        JOIN users u ON a.user_id = u.id 
        LIMIT 1
      `
    },
    {
      name: 'price_alerts → users',
      query: `
        SELECT pa.symbol, u.username 
        FROM price_alerts pa 
        JOIN users u ON pa.user_id = u.id 
        LIMIT 1
      `
    },
    {
      name: 'notifications → users',
      query: `
        SELECT n.message, u.username 
        FROM notifications n 
        JOIN users u ON n.user_id = u.id 
        LIMIT 1
      `
    }
  ];

  let workingRelationships = 0;
  
  for (const test of relationshipTests) {
    try {
      const { data, error } = await supabase.rpc('sql', { query: test.query });
      if (!error) {
        console.log(`  ✅ ${test.name}: Working`);
        workingRelationships++;
      } else {
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    } catch (e) {
      console.log(`  ❌ ${test.name}: ${e.message}`);
    }
  }

  // Method 4: Check constraint existence via table metadata
  console.log('\n📋 CONSTRAINT METADATA CHECK:');
  
  const tables = ['portfolio_holdings', 'agents', 'price_alerts', 'notifications', 'user_tasks'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .rpc('sql', {
          query: `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = '${table}' 
              AND table_schema = 'public'
              AND column_name LIKE '%user_id%'
          `
        });
      
      if (!error && data && data.length > 0) {
        console.log(`  ✅ ${table}: Has user_id column (${data[0].data_type})`);
      } else {
        console.log(`  ❌ ${table}: No user_id column found`);
      }
    } catch (e) {
      console.log(`  ❌ ${table}: ${e.message}`);
    }
  }

  return workingRelationships;
}

// Method 5: Check if we can use the sql RPC function
async function checkSqlRpcFunction() {
  console.log('\n🔧 CHECKING SQL RPC FUNCTION:');
  
  try {
    const { data, error } = await supabase.rpc('sql', { 
      query: 'SELECT 1 as test' 
    });
    
    if (!error) {
      console.log('  ✅ SQL RPC function is available');
      return true;
    } else {
      console.log('  ❌ SQL RPC function error:', error.message);
      return false;
    }
  } catch (e) {
    console.log('  ❌ SQL RPC function not available:', e.message);
    return false;
  }
}

async function main() {
  const sqlRpcAvailable = await checkSqlRpcFunction();
  
  if (sqlRpcAvailable) {
    const relationshipCount = await testForeignKeyRelationships();
    console.log(`\n🎯 FINAL RESULT: ${relationshipCount} working relationships detected`);
  } else {
    console.log('\n❌ Cannot verify foreign keys - SQL RPC function not available');
    console.log('Need to create a SQL function to check constraints');
  }
}

main().catch(console.error);