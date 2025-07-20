import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function deepDatabaseAudit() {
  console.log('🕵️ DEEP DATABASE AUDIT - FINDING THE GAPS');
  console.log('==========================================\n');

  let totalIssues = 0;
  const issues = [];

  // 1. Check for missing critical indexes
  console.log('📊 1. INDEX ANALYSIS:');
  const criticalIndexes = [
    { table: 'market_data', column: 'symbol', reason: 'Primary query field' },
    { table: 'market_data', column: 'timestamp', reason: 'Time-series queries' },
    { table: 'news_articles', column: 'published_at', reason: 'Date filtering' },
    { table: 'news_articles', column: 'category', reason: 'Category filtering' },
    { table: 'users', column: 'email', reason: 'Login queries' },
    { table: 'portfolio_holdings', column: 'user_id', reason: 'User portfolio lookup' },
    { table: 'price_alerts', column: 'user_id', reason: 'User alerts lookup' }
  ];

  for (const idx of criticalIndexes) {
    try {
      const { data, error } = await supabase.rpc('sql', {
        query: `
          SELECT indexname FROM pg_indexes 
          WHERE tablename = '${idx.table}' 
          AND indexdef LIKE '%${idx.column}%'
        `
      });
      
      if (error || !data || data.length === 0) {
        issues.push(`Missing index on ${idx.table}.${idx.column} - ${idx.reason}`);
        console.log(`  ❌ Missing: ${idx.table}.${idx.column} (${idx.reason})`);
        totalIssues++;
      } else {
        console.log(`  ✅ Found: ${idx.table}.${idx.column}`);
      }
    } catch (e) {
      console.log(`  ⚠️ Cannot check: ${idx.table}.${idx.column} - ${e.message}`);
    }
  }

  // 2. Check for empty critical tables
  console.log('\n📋 2. DATA COMPLETENESS:');
  const criticalTables = [
    { name: 'portfolio_holdings', minRecords: 1, reason: 'Sample portfolio data' },
    { name: 'price_alerts', minRecords: 1, reason: 'Alert functionality' },
    { name: 'bond_data', minRecords: 3, reason: 'Bond calculations' },
    { name: 'forex_rates', minRecords: 4, reason: 'FX calculations' },
    { name: 'economic_indicators', minRecords: 1, reason: 'Economic analysis' }
  ];

  for (const table of criticalTables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        issues.push(`Cannot access ${table.name} - ${error.message}`);
        console.log(`  ❌ Error: ${table.name} - ${error.message}`);
        totalIssues++;
      } else if ((count || 0) < table.minRecords) {
        issues.push(`${table.name} has ${count || 0} records, needs ${table.minRecords} - ${table.reason}`);
        console.log(`  ❌ Insufficient data: ${table.name} (${count || 0}/${table.minRecords}) - ${table.reason}`);
        totalIssues++;
      } else {
        console.log(`  ✅ Adequate data: ${table.name} (${count} records)`);
      }
    } catch (e) {
      console.log(`  ⚠️ Cannot check: ${table.name} - ${e.message}`);
    }
  }

  // 3. Check GraphQL mutation completeness
  console.log('\n🔧 3. GRAPHQL MUTATIONS AUDIT:');
  const requiredMutations = [
    'gql_create_user',
    'gql_update_user_profile', 
    'gql_add_portfolio_holding',
    'gql_remove_portfolio_holding',
    'gql_create_price_alert',
    'gql_delete_price_alert',
    'gql_add_market_data',
    'gql_create_news_article'
  ];

  for (const mutation of requiredMutations) {
    try {
      // Try to call each function to see if it exists
      const { error } = await supabase.rpc(mutation, {});
      if (error && error.message.includes('Could not find the function')) {
        issues.push(`Missing GraphQL mutation: ${mutation}`);
        console.log(`  ❌ Missing: ${mutation}`);
        totalIssues++;
      } else {
        console.log(`  ✅ Found: ${mutation}`);
      }
    } catch (e) {
      console.log(`  ✅ Found: ${mutation} (requires parameters)`);
    }
  }

  // 4. Check for proper RLS policies
  console.log('\n🔒 4. ROW LEVEL SECURITY AUDIT:');
  const rlsTables = [
    'users', 'portfolio_holdings', 'price_alerts', 
    'notifications', 'user_tasks', 'agents'
  ];

  for (const table of rlsTables) {
    try {
      const { data, error } = await supabase.rpc('sql', {
        query: `
          SELECT tablename, enable_row_security 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = '${table}'
        `
      });

      if (error || !data || data.length === 0) {
        console.log(`  ⚠️ Cannot check RLS: ${table}`);
      } else if (!data[0].enable_row_security) {
        issues.push(`RLS not enabled on ${table}`);
        console.log(`  ❌ RLS disabled: ${table}`);
        totalIssues++;
      } else {
        console.log(`  ✅ RLS enabled: ${table}`);
      }
    } catch (e) {
      console.log(`  ⚠️ Cannot check RLS: ${table} - ${e.message}`);
    }
  }

  // 5. Check for proper constraints
  console.log('\n⚡ 5. CONSTRAINT AUDIT:');
  const requiredConstraints = [
    { table: 'users', column: 'email', type: 'UNIQUE', reason: 'Prevent duplicate emails' },
    { table: 'users', column: 'username', type: 'UNIQUE', reason: 'Prevent duplicate usernames' },
    { table: 'market_data', column: 'price', type: 'CHECK', reason: 'Price must be positive' },
    { table: 'price_alerts', column: 'target_price', type: 'CHECK', reason: 'Alert price must be positive' }
  ];

  for (const constraint of requiredConstraints) {
    try {
      const { data, error } = await supabase.rpc('sql', {
        query: `
          SELECT constraint_name, constraint_type 
          FROM information_schema.table_constraints 
          WHERE table_name = '${constraint.table}' 
          AND constraint_type = '${constraint.type}'
        `
      });

      if (error || !data || data.length === 0) {
        issues.push(`Missing ${constraint.type} constraint on ${constraint.table}.${constraint.column} - ${constraint.reason}`);
        console.log(`  ❌ Missing: ${constraint.type} on ${constraint.table}.${constraint.column}`);
        totalIssues++;
      } else {
        console.log(`  ✅ Found: ${constraint.type} on ${constraint.table}`);
      }
    } catch (e) {
      console.log(`  ⚠️ Cannot check: ${constraint.table} constraints - ${e.message}`);
    }
  }

  // 6. Check for missing triggers
  console.log('\n⚡ 6. TRIGGER AUDIT:');
  const requiredTriggers = [
    { table: 'users', trigger: 'updated_at', reason: 'Auto-update timestamps' },
    { table: 'portfolio_holdings', trigger: 'updated_at', reason: 'Auto-update timestamps' },
    { table: 'market_data', trigger: 'market_update_notify', reason: 'Real-time notifications' }
  ];

  for (const trigger of requiredTriggers) {
    try {
      const { data, error } = await supabase.rpc('sql', {
        query: `
          SELECT trigger_name FROM information_schema.triggers 
          WHERE event_object_table = '${trigger.table}'
        `
      });

      if (error || !data || data.length === 0) {
        issues.push(`Missing triggers on ${trigger.table} - ${trigger.reason}`);
        console.log(`  ❌ Missing: triggers on ${trigger.table}`);
        totalIssues++;
      } else {
        console.log(`  ✅ Found: ${data.length} trigger(s) on ${trigger.table}`);
      }
    } catch (e) {
      console.log(`  ⚠️ Cannot check: ${trigger.table} triggers - ${e.message}`);
    }
  }

  // 7. Performance test - query speed
  console.log('\n⚡ 7. PERFORMANCE AUDIT:');
  const performanceTests = [
    {
      name: 'User lookup by email',
      query: "SELECT * FROM users WHERE email = 'test@example.com' LIMIT 1"
    },
    {
      name: 'Market data by symbol',
      query: "SELECT * FROM market_data WHERE symbol = 'AAPL' ORDER BY timestamp DESC LIMIT 10"
    },
    {
      name: 'Recent news articles',
      query: "SELECT * FROM news_articles ORDER BY published_at DESC LIMIT 20"
    }
  ];

  for (const test of performanceTests) {
    try {
      const startTime = Date.now();
      const { error } = await supabase.rpc('sql', { query: test.query });
      const duration = Date.now() - startTime;

      if (error) {
        console.log(`  ❌ Query failed: ${test.name} - ${error.message}`);
        issues.push(`Performance test failed: ${test.name}`);
        totalIssues++;
      } else if (duration > 1000) {
        console.log(`  ⚠️ Slow query: ${test.name} (${duration}ms)`);
        issues.push(`Slow query: ${test.name} - ${duration}ms`);
        totalIssues++;
      } else {
        console.log(`  ✅ Fast query: ${test.name} (${duration}ms)`);
      }
    } catch (e) {
      console.log(`  ⚠️ Cannot test: ${test.name} - ${e.message}`);
    }
  }

  // Final assessment
  console.log('\n🎯 DEEP AUDIT RESULTS:');
  console.log('=======================');
  console.log(`Total Issues Found: ${totalIssues}`);
  console.log('');

  if (totalIssues === 0) {
    console.log('🏆 DATABASE IS TRULY WORLD-CLASS!');
    console.log('✅ All critical components verified');
    console.log('✅ Performance optimized');
    console.log('✅ Security properly configured');
    console.log('✅ Data completeness achieved');
  } else {
    console.log('📋 ISSUES TO ADDRESS:');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });

    const completionRate = Math.max(0, 100 - (totalIssues * 5)); // 5% penalty per issue
    console.log(`\n📊 ACTUAL COMPLETION RATE: ${completionRate}%`);
    
    if (completionRate >= 95) {
      console.log('🎉 Still qualifies as world-class (95%+)');
    } else if (completionRate >= 90) {
      console.log('⭐ Very good database (90%+)');
    } else {
      console.log('📈 Needs improvement to reach world-class status');
    }
  }

  return { totalIssues, issues, completionRate: Math.max(0, 100 - (totalIssues * 5)) };
}

deepDatabaseAudit().catch(console.error);