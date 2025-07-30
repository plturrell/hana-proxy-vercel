import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk2NTEyMywiZXhwIjoyMDUwNTQxMTIzfQ.Kt9IU_wM7qO0B5cD6gJO8YS3mzgQoXm9vLgJj2hNnJY'
);

async function reviewCurrentState() {
  console.log('🔍 COMPREHENSIVE DATABASE REVIEW');
  console.log('================================\n');

  // 1. Check which tables actually exist
  const expectedTables = [
    'users', 'market_data', 'news_articles', 'a2a_agents', 'agents',
    'portfolio_holdings', 'bond_data', 'forex_rates', 'economic_indicators',
    'calculation_results', 'yield_curve', 'volatility_surface', 'correlation_matrix',
    'user_tasks', 'session_states', 'price_alerts', 'notifications',
    'process_executions', 'risk_parameters', 'audit_logs', 'security_events',
    'api_usage', 'ord_analytics_resources', 'a2a_analytics_communications', 'prdord_analytics'
  ];
  
  console.log('📋 TABLE EXISTENCE CHECK:');
  const existingTables = [];
  const missingTables = [];
  
  for (const table of expectedTables) {
    try {
      const { count, error: tableError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!tableError) {
        console.log(`  ✅ ${table} EXISTS (${count || 0} records)`);
        existingTables.push({ name: table, count: count || 0 });
      } else {
        console.log(`  ❌ ${table} MISSING - ${tableError.message}`);
        missingTables.push(table);
      }
    } catch (e) {
      console.log(`  ❌ ${table} ERROR - ${e.message}`);
      missingTables.push(table);
    }
  }

  console.log(`\n📊 SUMMARY: ${existingTables.length}/${expectedTables.length} tables exist`);
  console.log(`Missing tables: ${missingTables.join(', ')}`);

  // 2. Check specific table schemas for existing tables
  console.log('\n📊 SCHEMA VERIFICATION:');
  
  // Check market_data schema
  if (existingTables.find(t => t.name === 'market_data')) {
    try {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .limit(1);
      
      if (!error) {
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`  market_data columns: ${columns.join(', ')}`);
          
          const requiredCols = ['asset_type', 'bid', 'ask'];
          const missing = requiredCols.filter(col => !columns.includes(col));
          if (missing.length > 0) {
            console.log(`  ❌ market_data MISSING: ${missing.join(', ')}`);
          } else {
            console.log(`  ✅ market_data schema OK`);
          }
        } else {
          console.log(`  market_data table exists but empty - cannot check schema`);
        }
      }
    } catch (e) {
      console.log(`  ❌ market_data schema check failed: ${e.message}`);
    }
  }

  // Check users schema
  if (existingTables.find(t => t.name === 'users')) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (!error) {
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`  users columns: ${columns.join(', ')}`);
          
          const requiredCols = ['email', 'bio', 'subscription_tier'];
          const missing = requiredCols.filter(col => !columns.includes(col));
          if (missing.length > 0) {
            console.log(`  ❌ users MISSING: ${missing.join(', ')}`);
          } else {
            console.log(`  ✅ users schema OK`);
          }
        } else {
          console.log(`  users table exists but empty - cannot check schema`);
        }
      }
    } catch (e) {
      console.log(`  ❌ users schema check failed: ${e.message}`);
    }
  }

  // Check a2a_agents schema
  if (existingTables.find(t => t.name === 'a2a_agents')) {
    try {
      const { data, error } = await supabase
        .from('a2a_agents')
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`  a2a_agents columns: ${columns.join(', ')}`);
        
        const requiredCols = ['name', 'type', 'voting_power', 'blockchain_config', 'metadata'];
        const missing = requiredCols.filter(col => !columns.includes(col));
        if (missing.length > 0) {
          console.log(`  ❌ a2a_agents MISSING: ${missing.join(', ')}`);
        } else {
          console.log(`  ✅ a2a_agents schema OK`);
        }
      } else {
        console.log(`  a2a_agents exists but schema check failed or empty`);
      }
    } catch (e) {
      console.log(`  ❌ a2a_agents schema check failed: ${e.message}`);
    }
  }

  // Check news_articles schema
  if (existingTables.find(t => t.name === 'news_articles')) {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`  news_articles columns: ${columns.join(', ')}`);
        
        const requiredCols = ['sentiment_score', 'relevance_score', 'symbols', 'keywords'];
        const missing = requiredCols.filter(col => !columns.includes(col));
        if (missing.length > 0) {
          console.log(`  ❌ news_articles MISSING: ${missing.join(', ')}`);
        } else {
          console.log(`  ✅ news_articles schema OK`);
        }
      } else {
        console.log(`  news_articles exists but schema check failed or empty`);
      }
    } catch (e) {
      console.log(`  ❌ news_articles schema check failed: ${e.message}`);
    }
  }

  // 3. Check RLS policies on news_articles
  console.log('\n🔐 RLS POLICY CHECK:');
  try {
    const { data, error } = await supabase
      .from('news_articles')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ news_articles RLS blocking: ${error.message}`);
    } else {
      console.log(`  ✅ news_articles accessible (${data ? data.length : 0} records)`);
    }
  } catch (e) {
    console.log(`  ❌ news_articles RLS check failed: ${e.message}`);
  }

  // 4. Check API endpoints
  console.log('\n🌐 API ENDPOINT CHECK:');
  const endpoints = ['/api/health', '/api/supabase-proxy', '/api/unified', '/api/visual-builder-real'];
  const baseUrl = 'https://hana-proxy-vercel-pacnbexee-plturrells-projects.vercel.app';
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health' })
      });
      
      if (response.ok) {
        console.log(`  ✅ ${endpoint} (${response.status})`);
      } else {
        console.log(`  ❌ ${endpoint} (${response.status})`);
      }
    } catch (e) {
      console.log(`  ❌ ${endpoint} (error: ${e.message})`);
    }
  }

  console.log('\n🎯 ANALYSIS COMPLETE');
  console.log('====================');
  console.log(`Existing tables: ${existingTables.length}/${expectedTables.length}`);
  console.log(`Missing tables: ${missingTables.length}`);
  if (missingTables.length > 0) {
    console.log(`Missing: ${missingTables.join(', ')}`);
  }
}

reviewCurrentState().catch(console.error);