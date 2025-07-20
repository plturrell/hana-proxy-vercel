import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function comprehensiveDbAudit() {
  console.log('🔍 COMPREHENSIVE DATABASE AUDIT');
  console.log('================================\n');

  const auditResults = {
    foreignKeys: [],
    missingForeignKeys: [],
    indexes: [],
    missingIndexes: [],
    enumTypes: [],
    missingEnums: [],
    tableDescriptions: [],
    missingDescriptions: [],
    metadataIssues: [],
    relationshipIssues: []
  };

  // Get all tables
  const allTables = [
    'users', 'agents', 'a2a_agents', 'agent_interactions',
    'market_data', 'news_articles', 'news_queries', 
    'knowledge_graph_entities', 'rdf_triples',
    'portfolio_holdings', 'bond_data', 'forex_rates',
    'economic_indicators', 'yield_curve', 'volatility_surface',
    'correlation_matrix', 'user_tasks', 'session_states',
    'price_alerts', 'notifications', 'process_executions',
    'calculation_results', 'risk_parameters', 'audit_logs',
    'security_events', 'api_usage', 'ord_analytics_resources',
    'a2a_analytics_communications', 'prdord_analytics'
  ];

  console.log('📋 1. FOREIGN KEY RELATIONSHIPS AUDIT');
  console.log('=====================================');
  
  // Check foreign key relationships using SQL query
  try {
    const { data: fkData, error: fkError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
      `
    });

    if (!fkError && fkData) {
      console.log('✅ Current Foreign Key Relationships:');
      fkData.forEach(fk => {
        console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        auditResults.foreignKeys.push(fk);
      });
    } else {
      console.log('❌ Could not retrieve foreign key information');
    }
  } catch (e) {
    console.log('⚠️ Foreign key check failed, using manual analysis');
  }

  // Manual analysis of expected relationships
  console.log('\n🔗 Expected Relationships Analysis:');
  const expectedRelationships = [
    { table: 'agents', column: 'user_id', references: 'users.id' },
    { table: 'a2a_agents', column: 'base_agent_id', references: 'agents.id' },
    { table: 'agent_interactions', column: 'agent_id', references: 'agents.id' },
    { table: 'news_queries', column: 'user_id', references: 'users.id' },
    { table: 'rdf_triples', column: 'source_article_id', references: 'news_articles.id' },
    { table: 'portfolio_holdings', column: 'user_id', references: 'users.id' },
    { table: 'user_tasks', column: 'user_id', references: 'users.id' },
    { table: 'user_tasks', column: 'assigned_agent_id', references: 'agents.id' },
    { table: 'session_states', column: 'user_id', references: 'users.id' },
    { table: 'price_alerts', column: 'user_id', references: 'users.id' },
    { table: 'calculation_results', column: 'user_id', references: 'users.id' },
    { table: 'api_usage', column: 'user_id', references: 'users.id' }
  ];

  for (const rel of expectedRelationships) {
    const exists = auditResults.foreignKeys.some(fk => 
      fk.table_name === rel.table && fk.column_name === rel.column
    );
    
    if (!exists) {
      console.log(`  ❌ MISSING: ${rel.table}.${rel.column} → ${rel.references}`);
      auditResults.missingForeignKeys.push(rel);
    } else {
      console.log(`  ✅ EXISTS: ${rel.table}.${rel.column} → ${rel.references}`);
    }
  }

  console.log('\n📊 2. INDEX AUDIT');
  console.log('==================');
  
  // Check indexes
  try {
    const { data: indexData, error: indexError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename IN (${allTables.map(t => `'${t}'`).join(',')})
        ORDER BY tablename, indexname;
      `
    });

    if (!indexError && indexData) {
      console.log('✅ Current Indexes:');
      const tableIndexes = {};
      indexData.forEach(idx => {
        if (!tableIndexes[idx.tablename]) tableIndexes[idx.tablename] = [];
        tableIndexes[idx.tablename].push(idx.indexname);
        auditResults.indexes.push(idx);
      });

      Object.keys(tableIndexes).forEach(table => {
        console.log(`  ${table}: ${tableIndexes[table].length} indexes`);
      });
    }
  } catch (e) {
    console.log('⚠️ Index check failed');
  }

  console.log('\n🏷️  3. ENUMERATED TYPES AUDIT');
  console.log('=============================');
  
  // Check custom types
  try {
    const { data: typeData, error: typeError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          t.typname,
          e.enumlabel
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        ORDER BY t.typname, e.enumsortorder;
      `
    });

    if (!typeError && typeData) {
      console.log('✅ Current Enumerated Types:');
      const enumTypes = {};
      typeData.forEach(type => {
        if (!enumTypes[type.typname]) enumTypes[type.typname] = [];
        enumTypes[type.typname].push(type.enumlabel);
        auditResults.enumTypes.push(type);
      });

      Object.keys(enumTypes).forEach(typeName => {
        console.log(`  ${typeName}: ${enumTypes[typeName].join(', ')}`);
      });
    }
  } catch (e) {
    console.log('⚠️ Enum type check failed');
  }

  // Expected enum types
  const expectedEnums = [
    { name: 'subscription_tier', values: ['free', 'basic', 'premium', 'enterprise'] },
    { name: 'agent_status', values: ['active', 'inactive', 'suspended', 'pending'] },
    { name: 'agent_type', values: ['analytics', 'trading', 'research', 'compliance', 'autonomous'] },
    { name: 'asset_type', values: ['stock', 'bond', 'crypto', 'forex', 'commodity', 'option', 'future'] },
    { name: 'risk_level', values: ['low', 'medium', 'high', 'critical'] }
  ];

  console.log('\n🔍 Expected Enum Types Analysis:');
  expectedEnums.forEach(expected => {
    const exists = auditResults.enumTypes.some(e => e.typname === expected.name);
    if (!exists) {
      console.log(`  ❌ MISSING ENUM: ${expected.name} (${expected.values.join(', ')})`);
      auditResults.missingEnums.push(expected);
    } else {
      console.log(`  ✅ EXISTS: ${expected.name}`);
    }
  });

  console.log('\n📝 4. TABLE DESCRIPTIONS AUDIT');
  console.log('==============================');
  
  // Check table comments/descriptions
  try {
    const { data: descData, error: descError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          c.relname as table_name,
          obj_description(c.oid) as description
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'r'
        AND n.nspname = 'public'
        AND c.relname IN (${allTables.map(t => `'${t}'`).join(',')})
        ORDER BY c.relname;
      `
    });

    if (!descError && descData) {
      console.log('📋 Table Descriptions Status:');
      descData.forEach(desc => {
        if (desc.description) {
          console.log(`  ✅ ${desc.table_name}: "${desc.description}"`);
          auditResults.tableDescriptions.push(desc);
        } else {
          console.log(`  ❌ ${desc.table_name}: No description`);
          auditResults.missingDescriptions.push(desc.table_name);
        }
      });
    }
  } catch (e) {
    console.log('⚠️ Description check failed');
  }

  console.log('\n🔧 5. METADATA CONSISTENCY AUDIT');
  console.log('=================================');
  
  // Check for common metadata columns
  const expectedMetadataColumns = ['created_at', 'updated_at', 'id'];
  
  for (const table of allTables.slice(0, 5)) { // Sample check first 5 tables
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const columns = Object.keys(data[0]);
        const missingMeta = expectedMetadataColumns.filter(col => !columns.includes(col));
        
        if (missingMeta.length === 0) {
          console.log(`  ✅ ${table}: All metadata columns present`);
        } else {
          console.log(`  ⚠️ ${table}: Missing ${missingMeta.join(', ')}`);
          auditResults.metadataIssues.push({ table, missing: missingMeta });
        }
      } else if (!error) {
        console.log(`  📝 ${table}: Empty table, checking schema...`);
      }
    } catch (e) {
      console.log(`  ❌ ${table}: Error checking metadata`);
    }
  }

  // Generate audit summary
  console.log('\n📊 AUDIT SUMMARY');
  console.log('=================');
  console.log(`✅ Foreign Keys Found: ${auditResults.foreignKeys.length}`);
  console.log(`❌ Missing Foreign Keys: ${auditResults.missingForeignKeys.length}`);
  console.log(`✅ Indexes Found: ${auditResults.indexes.length}`);
  console.log(`✅ Enum Types Found: ${new Set(auditResults.enumTypes.map(e => e.typname)).size}`);
  console.log(`❌ Missing Enum Types: ${auditResults.missingEnums.length}`);
  console.log(`❌ Tables Without Descriptions: ${auditResults.missingDescriptions.length}`);
  
  if (auditResults.missingForeignKeys.length > 0 || 
      auditResults.missingEnums.length > 0 || 
      auditResults.missingDescriptions.length > 0) {
    console.log('\n⚠️ ISSUES FOUND - Fix recommendations will be generated');
  } else {
    console.log('\n🎉 DATABASE AUDIT PASSED - Excellent schema design!');
  }

  return auditResults;
}

// Note: This uses a custom RPC function that might not exist
// If it fails, we'll use alternative methods
async function fallbackDbAudit() {
  console.log('🔄 Running fallback audit using direct table queries...\n');
  
  // Simplified audit without SQL functions
  const tables = ['users', 'market_data', 'news_articles', 'a2a_agents', 'portfolio_holdings'];
  
  console.log('📋 Sample Table Structure Analysis:');
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`\n${table.toUpperCase()}:`);
          console.log(`  Columns (${columns.length}): ${columns.join(', ')}`);
          
          // Check for common patterns
          const hasId = columns.includes('id') || columns.includes('user_id') || columns.includes('agent_id');
          const hasTimestamps = columns.includes('created_at') && columns.includes('updated_at');
          const hasUserRef = columns.includes('user_id');
          
          console.log(`  ✅ Primary Key: ${hasId ? 'Yes' : 'Missing'}`);
          console.log(`  ✅ Timestamps: ${hasTimestamps ? 'Yes' : 'Missing'}`);
          console.log(`  🔗 User Reference: ${hasUserRef ? 'Yes' : 'No'}`);
        } else {
          console.log(`\n${table.toUpperCase()}: Empty table`);
        }
      }
    } catch (e) {
      console.log(`\n${table.toUpperCase()}: Error - ${e.message}`);
    }
  }
}

// Try comprehensive audit first, fallback if needed
comprehensiveDbAudit().catch(() => {
  console.log('Comprehensive audit failed, running fallback...\n');
  return fallbackDbAudit();
}).catch(console.error);