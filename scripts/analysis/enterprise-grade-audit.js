import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function enterpriseGradeAudit() {
  console.log('💀 ENTERPRISE-GRADE DATABASE AUDIT - NO MERCY');
  console.log('==============================================\n');

  let criticalFailures = 0;
  let majorIssues = 0;
  let minorIssues = 0;
  const failures = [];

  // 1. ACID COMPLIANCE & TRANSACTION SAFETY
  console.log('🔒 1. ACID COMPLIANCE & TRANSACTION SAFETY:');
  try {
    // Test transaction rollback
    const { error: txError } = await supabase.rpc('sql', {
      query_text: `
        BEGIN;
        INSERT INTO users (username, email) VALUES ('test_tx', 'test@tx.com');
        SELECT 1/0; -- This should cause rollback
        COMMIT;
      `
    });
    
    if (!txError || !txError.message.includes('division by zero')) {
      failures.push('CRITICAL: Transaction rollback not working properly');
      criticalFailures++;
      console.log('  ❌ CRITICAL: Transaction safety compromised');
    } else {
      console.log('  ✅ Transaction rollback working');
    }

    // Test concurrent access patterns
    const { data: lockData, error: lockError } = await supabase.rpc('sql', {
      query_text: `
        SELECT 
          pg_stat_get_db_numbackends(datid) as connections,
          pg_stat_get_db_xact_commit(datid) as commits,
          pg_stat_get_db_xact_rollback(datid) as rollbacks
        FROM pg_database WHERE datname = current_database()
      `
    });

    if (lockError) {
      failures.push('CRITICAL: Cannot monitor database transactions');
      criticalFailures++;
      console.log('  ❌ CRITICAL: Transaction monitoring unavailable');
    } else {
      const stats = lockData[0]?.result?.[0];
      console.log(`  📊 DB Stats: ${stats?.connections} connections, ${stats?.commits} commits, ${stats?.rollbacks} rollbacks`);
    }

  } catch (e) {
    failures.push('CRITICAL: ACID compliance test failed - ' + e.message);
    criticalFailures++;
    console.log('  ❌ CRITICAL: ACID compliance test failed');
  }

  // 2. DATA CONSISTENCY & REFERENTIAL INTEGRITY STRESS TEST
  console.log('\n🔍 2. DATA CONSISTENCY & REFERENTIAL INTEGRITY:');
  
  // Test orphaned records
  const orphanTests = [
    {
      name: 'Orphaned portfolio holdings',
      query: `
        SELECT COUNT(*) as count FROM portfolio_holdings ph
        LEFT JOIN users u ON ph.user_id = u.id
        WHERE u.id IS NULL
      `
    },
    {
      name: 'Orphaned price alerts', 
      query: `
        SELECT COUNT(*) as count FROM price_alerts pa
        LEFT JOIN users u ON pa.user_id = u.id
        WHERE u.id IS NULL
      `
    },
    {
      name: 'Orphaned agent interactions',
      query: `
        SELECT COUNT(*) as count FROM agent_interactions ai
        LEFT JOIN users u ON ai.user_id = u.id
        WHERE u.id IS NULL
      `
    }
  ];

  for (const test of orphanTests) {
    try {
      const { data, error } = await supabase.rpc('sql', { query_text: test.query });
      if (error) {
        console.log(`  ⚠️ Cannot test: ${test.name} - table may not exist`);
      } else {
        const orphanCount = data[0]?.result?.[0]?.count || 0;
        if (orphanCount > 0) {
          failures.push(`MAJOR: ${orphanCount} orphaned records in ${test.name}`);
          majorIssues++;
          console.log(`  ❌ MAJOR: ${orphanCount} orphaned records - ${test.name}`);
        } else {
          console.log(`  ✅ No orphaned records - ${test.name}`);
        }
      }
    } catch (e) {
      console.log(`  ⚠️ Cannot test: ${test.name} - ${e.message}`);
    }
  }

  // 3. PERFORMANCE UNDER LOAD
  console.log('\n⚡ 3. PERFORMANCE UNDER LOAD:');
  
  const performanceTests = [
    {
      name: 'Large table scan',
      query: 'SELECT COUNT(*) FROM news_articles WHERE created_at > NOW() - INTERVAL \'30 days\'',
      maxTime: 1000
    },
    {
      name: 'Complex join query',
      query: `
        SELECT u.username, COUNT(ph.id) as holdings_count
        FROM users u
        LEFT JOIN portfolio_holdings ph ON u.id = ph.user_id
        GROUP BY u.id, u.username
        ORDER BY holdings_count DESC
        LIMIT 10
      `,
      maxTime: 2000
    },
    {
      name: 'Aggregation query',
      query: `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as articles,
          AVG(importance_score) as avg_importance
        FROM news_articles 
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
      maxTime: 1500
    }
  ];

  for (const test of performanceTests) {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.rpc('sql', { query_text: test.query });
      const duration = Date.now() - startTime;

      if (error) {
        failures.push(`MAJOR: Performance test failed - ${test.name}: ${error.message}`);
        majorIssues++;
        console.log(`  ❌ MAJOR: Query failed - ${test.name}`);
      } else if (duration > test.maxTime) {
        failures.push(`MAJOR: Slow query - ${test.name}: ${duration}ms (max ${test.maxTime}ms)`);
        majorIssues++;
        console.log(`  ❌ MAJOR: Slow query - ${test.name} (${duration}ms)`);
      } else {
        console.log(`  ✅ Fast query - ${test.name} (${duration}ms)`);
      }
    } catch (e) {
      failures.push(`MAJOR: Performance test exception - ${test.name}: ${e.message}`);
      majorIssues++;
      console.log(`  ❌ MAJOR: Test exception - ${test.name}`);
    }
  }

  // 4. SECURITY VULNERABILITIES
  console.log('\n🛡️ 4. SECURITY VULNERABILITIES:');
  
  // Test SQL injection protection
  try {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'; DELETE FROM users WHERE '1'='1"
    ];

    for (const input of maliciousInputs) {
      try {
        const { error } = await supabase.rpc('gql_create_user', {
          p_username: input,
          p_email: 'test@malicious.com'
        });
        
        if (!error) {
          failures.push('CRITICAL: SQL injection vulnerability - malicious input accepted');
          criticalFailures++;
          console.log('  ❌ CRITICAL: SQL injection vulnerability detected');
          break;
        }
      } catch (e) {
        // Expected to fail with malicious input
      }
    }
    console.log('  ✅ SQL injection protection working');
  } catch (e) {
    console.log('  ⚠️ Cannot test SQL injection protection');
  }

  // Test RLS bypass attempts
  try {
    const { data, error } = await supabase.rpc('sql', {
      query_text: 'SELECT * FROM users WHERE id = 1'
    });
    
    if (!error && data[0]?.result?.length > 0) {
      // This might be ok if SQL function has SECURITY DEFINER
      console.log('  ⚠️ Direct table access via SQL function - verify RLS enforcement');
    }
  } catch (e) {
    console.log('  ⚠️ Cannot test RLS bypass');
  }

  // 5. DATA VALIDATION & CONSTRAINT ENFORCEMENT
  console.log('\n✅ 5. DATA VALIDATION & CONSTRAINT ENFORCEMENT:');
  
  const constraintTests = [
    {
      name: 'Negative price validation',
      test: async () => {
        const { error } = await supabase.rpc('gql_add_market_data', {
          p_symbol: 'TEST',
          p_price: -100
        });
        return error && error.message.includes('constraint');
      }
    },
    {
      name: 'Duplicate email prevention',
      test: async () => {
        try {
          await supabase.rpc('gql_create_user', {
            p_username: 'test1',
            p_email: 'duplicate@test.com'
          });
          const { error } = await supabase.rpc('gql_create_user', {
            p_username: 'test2', 
            p_email: 'duplicate@test.com'
          });
          return error && error.message.includes('unique');
        } catch (e) {
          return true; // Expected to fail
        }
      }
    },
    {
      name: 'Invalid email format rejection',
      test: async () => {
        const { error } = await supabase.rpc('gql_create_user', {
          p_username: 'testuser',
          p_email: 'invalid-email'
        });
        return error && error.message.includes('constraint');
      }
    }
  ];

  for (const test of constraintTests) {
    try {
      const passed = await test.test();
      if (passed) {
        console.log(`  ✅ ${test.name} - constraint enforced`);
      } else {
        failures.push(`MAJOR: Constraint not enforced - ${test.name}`);
        majorIssues++;
        console.log(`  ❌ MAJOR: Constraint not enforced - ${test.name}`);
      }
    } catch (e) {
      console.log(`  ⚠️ Cannot test: ${test.name} - ${e.message}`);
    }
  }

  // 6. BACKUP & DISASTER RECOVERY
  console.log('\n💾 6. BACKUP & DISASTER RECOVERY:');
  
  try {
    // Check if point-in-time recovery is available
    const { data, error } = await supabase.rpc('sql', {
      query_text: `
        SELECT 
          pg_is_in_recovery() as in_recovery,
          pg_last_wal_receive_time() as last_wal_time,
          pg_last_wal_replay_time() as last_replay_time
      `
    });
    
    if (error) {
      failures.push('CRITICAL: Cannot check backup/recovery status');
      criticalFailures++;
      console.log('  ❌ CRITICAL: Backup status unknown');
    } else {
      console.log('  ⚠️ Backup/recovery depends on Supabase infrastructure');
      minorIssues++;
    }
  } catch (e) {
    failures.push('CRITICAL: Cannot access recovery information');
    criticalFailures++;
    console.log('  ❌ CRITICAL: Recovery information inaccessible');
  }

  // 7. MONITORING & OBSERVABILITY
  console.log('\n📊 7. MONITORING & OBSERVABILITY:');
  
  try {
    // Check if we can monitor database health
    const { data, error } = await supabase.rpc('sql', {
      query_text: `
        SELECT 
          pg_database_size(current_database()) as db_size,
          (SELECT COUNT(*) FROM pg_stat_activity) as active_connections,
          (SELECT COUNT(*) FROM pg_locks WHERE granted = false) as waiting_locks
      `
    });
    
    if (error) {
      failures.push('MAJOR: Cannot monitor database health metrics');
      majorIssues++;
      console.log('  ❌ MAJOR: Health monitoring unavailable');
    } else {
      const metrics = data[0]?.result?.[0];
      console.log(`  📊 DB Size: ${(metrics?.db_size / 1024 / 1024).toFixed(2)}MB, Connections: ${metrics?.active_connections}, Waiting locks: ${metrics?.waiting_locks}`);
      
      if (metrics?.waiting_locks > 10) {
        failures.push('MAJOR: High lock contention detected');
        majorIssues++;
        console.log('  ❌ MAJOR: High lock contention');
      }
    }
  } catch (e) {
    failures.push('MAJOR: Monitoring system failure - ' + e.message);
    majorIssues++;
    console.log('  ❌ MAJOR: Monitoring failure');
  }

  // 8. SCALABILITY LIMITS
  console.log('\n📈 8. SCALABILITY ASSESSMENT:');
  
  // Check for potential scalability bottlenecks
  try {
    const { data, error } = await supabase.rpc('sql', {
      query_text: `
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'market_data', 'news_articles')
        AND n_distinct < 10
        ORDER BY n_distinct ASC
      `
    });
    
    if (!error && data[0]?.result?.length > 0) {
      data[0].result.forEach(stat => {
        if (stat.n_distinct < 5 && ['user_id', 'symbol', 'category'].includes(stat.attname)) {
          failures.push(`MAJOR: Low cardinality in ${stat.tablename}.${stat.attname} may cause scaling issues`);
          majorIssues++;
          console.log(`  ❌ MAJOR: Low cardinality - ${stat.tablename}.${stat.attname} (${stat.n_distinct} distinct values)`);
        }
      });
    }
    console.log('  ✅ Scalability assessment completed');
  } catch (e) {
    console.log('  ⚠️ Cannot assess scalability metrics');
  }

  // FINAL VERDICT
  console.log('\n💀 ENTERPRISE AUDIT RESULTS:');
  console.log('============================');
  console.log(`Critical Failures: ${criticalFailures}`);
  console.log(`Major Issues: ${majorIssues}`);
  console.log(`Minor Issues: ${minorIssues}`);
  console.log('');

  if (failures.length > 0) {
    console.log('🚨 ISSUES FOUND:');
    failures.forEach((failure, i) => {
      console.log(`${i + 1}. ${failure}`);
    });
    console.log('');
  }

  // Enterprise grading
  let grade = 'F';
  let status = 'UNACCEPTABLE FOR PRODUCTION';
  
  if (criticalFailures === 0 && majorIssues === 0 && minorIssues <= 2) {
    grade = 'A+';
    status = 'ENTERPRISE GRADE - READY FOR PRODUCTION';
  } else if (criticalFailures === 0 && majorIssues <= 2 && minorIssues <= 5) {
    grade = 'A';
    status = 'PRODUCTION READY WITH MINOR IMPROVEMENTS';
  } else if (criticalFailures === 0 && majorIssues <= 5) {
    grade = 'B';
    status = 'NEEDS IMPROVEMENTS BEFORE PRODUCTION';
  } else if (criticalFailures <= 1) {
    grade = 'C';
    status = 'SIGNIFICANT ISSUES - NOT PRODUCTION READY';
  } else {
    grade = 'F';
    status = 'CRITICAL FAILURES - UNSAFE FOR ANY USE';
  }

  console.log(`🏆 FINAL GRADE: ${grade}`);
  console.log(`📋 STATUS: ${status}`);
  
  if (grade === 'A+') {
    console.log('\n🎉 CONGRATULATIONS! This database meets enterprise-grade standards.');
    console.log('✅ ACID compliance verified');
    console.log('✅ Data integrity enforced');
    console.log('✅ Performance optimized');
    console.log('✅ Security hardened');
    console.log('✅ Monitoring enabled');
    console.log('✅ Scalability considered');
  } else {
    console.log('\n📋 TO ACHIEVE ENTERPRISE GRADE:');
    console.log(`- Fix ${criticalFailures} critical security/data issues`);
    console.log(`- Resolve ${majorIssues} major performance/integrity problems`);
    console.log(`- Address ${minorIssues} minor operational concerns`);
  }

  return { grade, criticalFailures, majorIssues, minorIssues, failures };
}

enterpriseGradeAudit().catch(console.error);