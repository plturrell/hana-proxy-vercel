import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function assessGraphQL() {
  console.log('🎯 COMPREHENSIVE GRAPHQL ASSESSMENT');
  console.log('===================================\n');

  let score = 0;
  let maxScore = 0;
  let issues = [];

  // 1. Check all expected GraphQL views
  console.log('1️⃣ GRAPHQL VIEWS CHECK:');
  const expectedViews = [
    'gql_users', 'gql_market_data', 'gql_news_articles', 'gql_portfolios',
    'gql_watchlists', 'gql_price_alerts', 'gql_trading_strategies',
    'gql_portfolio_holdings', 'gql_transactions', 'gql_user_connections'
  ];

  for (const viewName of expectedViews) {
    const { data, error } = await supabase.rpc('sql_safe', {
      query_text: `SELECT COUNT(*) as exists FROM information_schema.views WHERE table_schema = 'public' AND table_name = '${viewName}'`
    });

    maxScore++;
    if (!error && data?.[0]?.result?.[0]?.exists === '1') {
      console.log(`  ✅ ${viewName}: EXISTS`);
      score++;
    } else {
      console.log(`  ❌ ${viewName}: MISSING`);
      issues.push(`Missing view: ${viewName}`);
    }
  }

  // 2. Check GraphQL functions
  console.log('\n2️⃣ GRAPHQL MUTATIONS CHECK:');
  const expectedFunctions = [
    'gql_create_user', 'gql_update_user', 'gql_delete_user'
  ];

  for (const funcName of expectedFunctions) {
    const { data, error } = await supabase.rpc('sql_safe', {
      query_text: `SELECT COUNT(*) as exists FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = '${funcName}'`
    });

    maxScore++;
    if (!error && data?.[0]?.result?.[0]?.exists === '1') {
      console.log(`  ✅ ${funcName}: EXISTS`);
      score++;
    } else {
      console.log(`  ❌ ${funcName}: MISSING`);
      issues.push(`Missing function: ${funcName}`);
    }
  }

  // 3. Test data accessibility
  console.log('\n3️⃣ DATA ACCESSIBILITY TEST:');
  const viewTests = [
    { view: 'gql_users', test: 'Basic user data' },
    { view: 'gql_agents', test: 'Agent registry data' },
    { view: 'gql_sectors', test: 'Sector reference data' }
  ];

  for (const test of viewTests) {
    try {
      const { data, error } = await supabase.from(test.view).select('*').limit(1);
      maxScore++;
      if (!error) {
        console.log(`  ✅ ${test.test}: ACCESSIBLE`);
        score++;
      } else {
        console.log(`  ❌ ${test.test}: ERROR - ${error.message}`);
        issues.push(`Cannot access ${test.view}`);
      }
    } catch (e) {
      console.log(`  ❌ ${test.test}: FAILED`);
      issues.push(`Failed to test ${test.view}`);
    }
  }

  // 4. Check RLS policies
  console.log('\n4️⃣ ROW LEVEL SECURITY CHECK:');
  const { data: rlsData, error: rlsError } = await supabase.rpc('sql_safe', {
    query_text: `
      SELECT 
        schemaname,
        tablename,
        COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'public' 
      AND tablename LIKE 'gql_%'
      GROUP BY schemaname, tablename
      ORDER BY tablename
    `
  });

  if (!rlsError && rlsData?.[0]?.result) {
    const viewsWithRLS = rlsData[0].result.length;
    if (viewsWithRLS > 0) {
      console.log(`  ✅ RLS Policies: ${viewsWithRLS} views protected`);
      score += 5;
    } else {
      console.log('  ⚠️ No RLS policies on GraphQL views (views inherit from base tables)');
    }
    maxScore += 5;
  }

  // 5. Performance check
  console.log('\n5️⃣ PERFORMANCE OPTIMIZATION:');
  const { data: perfData, error: perfError } = await supabase.rpc('sql_safe', {
    query_text: `
      SELECT COUNT(*) as index_count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN (
        SELECT tablename 
        FROM pg_views 
        WHERE viewname LIKE 'gql_%'
      )
    `
  });

  if (!perfError && perfData?.[0]?.result?.[0]) {
    const indexCount = parseInt(perfData[0].result[0].index_count);
    if (indexCount >= 10) {
      console.log(`  ✅ Indexes on base tables: ${indexCount} (Excellent)`);
      score += 5;
    } else {
      console.log(`  ⚠️ Indexes on base tables: ${indexCount} (Could be improved)`);
      score += 3;
    }
    maxScore += 5;
  }

  // Final Assessment
  const percentage = Math.round((score / maxScore) * 100);
  console.log('\n📊 GRAPHQL ASSESSMENT RESULTS:');
  console.log('================================');
  console.log(`Total Score: ${score}/${maxScore} (${percentage}%)`);
  
  if (percentage >= 90) {
    console.log('🎉 GraphQL API is PRODUCTION READY!');
  } else if (percentage >= 70) {
    console.log('✅ GraphQL API is functional but needs improvements');
  } else {
    console.log('❌ GraphQL API needs significant work');
  }

  if (issues.length > 0) {
    console.log('\n🔧 ISSUES TO FIX:');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  }

  // Show how to use GraphQL
  console.log('\n📚 GRAPHQL USAGE EXAMPLES:');
  console.log('================================');
  console.log('// Query users through PostgREST:');
  console.log(`const { data } = await supabase.from('gql_users').select('*')`);
  console.log('\n// Call mutation function:');
  console.log(`const { data } = await supabase.rpc('gql_update_user_profile', { 
  p_user_id: 'uuid', 
  p_updates: { full_name: 'New Name' }
})`);
}

assessGraphQL().catch(console.error);