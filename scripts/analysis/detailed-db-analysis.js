import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function detailedDatabaseAnalysis() {
  console.log('🔍 DETAILED DATABASE STRUCTURE ANALYSIS');
  console.log('========================================\n');

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

  const analysisResults = {
    tableStructures: {},
    foreignKeyIssues: [],
    indexIssues: [],
    enumIssues: [],
    metadataIssues: [],
    relationshipMapping: {},
    inconsistencies: []
  };

  console.log('📋 STEP 1: TABLE STRUCTURE ANALYSIS');
  console.log('===================================');

  // Analyze each table structure
  for (const table of allTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          const sample = data[0];
          
          // Analyze column types and patterns
          const columnAnalysis = {};
          columns.forEach(col => {
            const value = sample[col];
            const type = typeof value;
            const isNull = value === null;
            
            columnAnalysis[col] = {
              type: type,
              isNull: isNull,
              sample: isNull ? 'NULL' : (type === 'string' ? value.substring(0, 50) : value)
            };
          });

          analysisResults.tableStructures[table] = {
            exists: true,
            hasData: true,
            columnCount: columns.length,
            columns: columns,
            columnAnalysis: columnAnalysis,
            recordCount: 'has_data'
          };

          console.log(`✅ ${table} (${columns.length} columns, has data)`);
          
        } else {
          // Table exists but empty - get column info differently
          analysisResults.tableStructures[table] = {
            exists: true,
            hasData: false,
            columnCount: 0,
            columns: [],
            recordCount: 0
          };
          console.log(`📝 ${table} (empty table)`);
        }
      } else {
        analysisResults.tableStructures[table] = {
          exists: false,
          error: error.message
        };
        console.log(`❌ ${table} (ERROR: ${error.message})`);
      }
    } catch (e) {
      analysisResults.tableStructures[table] = {
        exists: false,
        error: e.message
      };
      console.log(`❌ ${table} (EXCEPTION: ${e.message})`);
    }
  }

  console.log('\n🔗 STEP 2: RELATIONSHIP PATTERN ANALYSIS');
  console.log('=========================================');

  // Analyze relationship patterns
  const relationshipPatterns = {
    userRelated: [],
    agentRelated: [],
    marketDataRelated: [],
    newsRelated: [],
    orphanTables: []
  };

  Object.keys(analysisResults.tableStructures).forEach(table => {
    const structure = analysisResults.tableStructures[table];
    if (structure.exists && structure.columns) {
      const columns = structure.columns;
      
      // Check for user relationships
      if (columns.includes('user_id')) {
        relationshipPatterns.userRelated.push(table);
      }
      
      // Check for agent relationships
      if (columns.includes('agent_id') || columns.includes('assigned_agent_id') || columns.includes('base_agent_id')) {
        relationshipPatterns.agentRelated.push(table);
      }
      
      // Check for market data relationships
      if (columns.includes('symbol') || table.includes('market') || table.includes('forex') || table.includes('bond')) {
        relationshipPatterns.marketDataRelated.push(table);
      }
      
      // Check for news relationships
      if (columns.includes('article_id') || table.includes('news') || table.includes('knowledge')) {
        relationshipPatterns.newsRelated.push(table);
      }
      
      // Check for orphan tables (no obvious relationships)
      const hasRelationship = columns.some(col => 
        col.includes('_id') || col === 'id' || col.includes('user') || col.includes('agent')
      );
      
      if (!hasRelationship && !['users', 'agents'].includes(table)) {
        relationshipPatterns.orphanTables.push(table);
      }
    }
  });

  console.log('User-related tables:', relationshipPatterns.userRelated.join(', '));
  console.log('Agent-related tables:', relationshipPatterns.agentRelated.join(', '));
  console.log('Market data tables:', relationshipPatterns.marketDataRelated.join(', '));
  console.log('News-related tables:', relationshipPatterns.newsRelated.join(', '));
  console.log('Potential orphan tables:', relationshipPatterns.orphanTables.join(', '));

  console.log('\n🏗️ STEP 3: PRIMARY KEY ANALYSIS');
  console.log('================================');

  const primaryKeyIssues = [];
  Object.keys(analysisResults.tableStructures).forEach(table => {
    const structure = analysisResults.tableStructures[table];
    if (structure.exists && structure.columns) {
      const columns = structure.columns;
      
      // Check for primary key patterns
      const hasId = columns.includes('id');
      const hasUuidId = columns.includes('user_id') || columns.includes('agent_id');
      const hasCompositeKey = columns.length > 0 && !hasId && !hasUuidId;
      
      let pkStatus = 'unknown';
      if (hasId) pkStatus = 'standard_id';
      else if (hasUuidId) pkStatus = 'uuid_id';
      else if (hasCompositeKey) pkStatus = 'possible_composite';
      else pkStatus = 'missing';
      
      console.log(`  ${table}: ${pkStatus}`);
      
      if (pkStatus === 'missing' || pkStatus === 'unknown') {
        primaryKeyIssues.push({ table, issue: pkStatus, columns });
      }
    }
  });

  console.log('\n📊 STEP 4: DATA TYPE CONSISTENCY ANALYSIS');
  console.log('==========================================');

  const dataTypeIssues = [];
  const commonFields = {
    'created_at': [],
    'updated_at': [],
    'user_id': [],
    'agent_id': [],
    'symbol': [],
    'price': [],
    'timestamp': []
  };

  // Collect how common fields are implemented across tables
  Object.keys(analysisResults.tableStructures).forEach(table => {
    const structure = analysisResults.tableStructures[table];
    if (structure.exists && structure.columnAnalysis) {
      Object.keys(commonFields).forEach(field => {
        if (structure.columns.includes(field)) {
          const analysis = structure.columnAnalysis[field];
          commonFields[field].push({
            table,
            type: analysis.type,
            sample: analysis.sample
          });
        }
      });
    }
  });

  console.log('Common field implementations:');
  Object.keys(commonFields).forEach(field => {
    const implementations = commonFields[field];
    if (implementations.length > 0) {
      const types = [...new Set(implementations.map(impl => impl.type))];
      console.log(`  ${field}: ${implementations.length} tables, types: ${types.join(', ')}`);
      
      if (types.length > 1) {
        console.log(`    ⚠️  Inconsistent types across tables:`);
        implementations.forEach(impl => {
          console.log(`      ${impl.table}: ${impl.type} (${impl.sample})`);
        });
        dataTypeIssues.push({ field, inconsistentTypes: implementations });
      }
    }
  });

  console.log('\n🔍 STEP 5: MISSING RELATIONSHIP IDENTIFICATION');
  console.log('===============================================');

  const expectedRelationships = [
    { from: 'agents', field: 'user_id', to: 'users', toField: 'id', purpose: 'Agent ownership' },
    { from: 'portfolio_holdings', field: 'user_id', to: 'users', toField: 'id', purpose: 'Portfolio ownership' },
    { from: 'user_tasks', field: 'user_id', to: 'users', toField: 'id', purpose: 'Task ownership' },
    { from: 'user_tasks', field: 'assigned_agent_id', to: 'agents', toField: 'id', purpose: 'Task assignment' },
    { from: 'calculation_results', field: 'user_id', to: 'users', toField: 'id', purpose: 'Calculation ownership' },
    { from: 'price_alerts', field: 'user_id', to: 'users', toField: 'id', purpose: 'Alert ownership' },
    { from: 'session_states', field: 'user_id', to: 'users', toField: 'id', purpose: 'Session tracking' },
    { from: 'news_queries', field: 'user_id', to: 'users', toField: 'id', purpose: 'Query history' },
    { from: 'rdf_triples', field: 'source_article_id', to: 'news_articles', toField: 'id', purpose: 'Knowledge extraction' },
    { from: 'a2a_agents', field: 'base_agent_id', to: 'agents', toField: 'id', purpose: 'Agent hierarchy' }
  ];

  const missingRelationships = [];
  expectedRelationships.forEach(rel => {
    const fromTable = analysisResults.tableStructures[rel.from];
    const toTable = analysisResults.tableStructures[rel.to];
    
    if (fromTable && fromTable.exists && toTable && toTable.exists) {
      const hasField = fromTable.columns && fromTable.columns.includes(rel.field);
      const targetExists = toTable.columns && toTable.columns.includes(rel.toField);
      
      if (!hasField) {
        missingRelationships.push({
          ...rel,
          issue: 'missing_source_field',
          status: `${rel.from}.${rel.field} does not exist`
        });
      } else if (!targetExists) {
        missingRelationships.push({
          ...rel,
          issue: 'missing_target_field', 
          status: `${rel.to}.${rel.toField} does not exist`
        });
      } else {
        console.log(`  ✅ ${rel.from}.${rel.field} → ${rel.to}.${rel.toField} (fields exist)`);
      }
    } else {
      missingRelationships.push({
        ...rel,
        issue: 'missing_table',
        status: `Table missing: ${!fromTable?.exists ? rel.from : rel.to}`
      });
    }
  });

  if (missingRelationships.length > 0) {
    console.log('\n❌ Missing/Broken Relationships:');
    missingRelationships.forEach(rel => {
      console.log(`  ${rel.status} - ${rel.purpose}`);
    });
  }

  console.log('\n📋 STEP 6: ENUM TYPES NEEDED ANALYSIS');
  console.log('=====================================');

  const potentialEnums = {
    'subscription_tier': { tables: ['users'], values: ['free', 'basic', 'premium', 'enterprise'] },
    'agent_status': { tables: ['agents', 'a2a_agents'], values: ['active', 'inactive', 'suspended', 'pending'] },
    'agent_type': { tables: ['agents', 'a2a_agents'], values: ['analytics', 'trading', 'research', 'compliance'] },
    'asset_type': { tables: ['market_data', 'portfolio_holdings'], values: ['stock', 'bond', 'crypto', 'forex'] },
    'calculation_status': { tables: ['calculation_results'], values: ['pending', 'completed', 'failed', 'cached'] },
    'alert_status': { tables: ['price_alerts'], values: ['active', 'triggered', 'expired', 'cancelled'] }
  };

  console.log('Recommended enum types:');
  Object.keys(potentialEnums).forEach(enumName => {
    const enumDef = potentialEnums[enumName];
    console.log(`  ${enumName}: ${enumDef.values.join(', ')}`);
    console.log(`    Used in: ${enumDef.tables.join(', ')}`);
  });

  // Final summary
  console.log('\n📊 ANALYSIS SUMMARY');
  console.log('===================');
  console.log(`Total tables analyzed: ${Object.keys(analysisResults.tableStructures).length}`);
  console.log(`Tables with data: ${Object.values(analysisResults.tableStructures).filter(t => t.hasData).length}`);
  console.log(`Primary key issues: ${primaryKeyIssues.length}`);
  console.log(`Data type inconsistencies: ${dataTypeIssues.length}`);
  console.log(`Missing relationships: ${missingRelationships.length}`);
  console.log(`Recommended enum types: ${Object.keys(potentialEnums).length}`);

  return {
    tableStructures: analysisResults.tableStructures,
    relationshipPatterns,
    primaryKeyIssues,
    dataTypeIssues,
    missingRelationships,
    potentialEnums
  };
}

detailedDatabaseAnalysis().catch(console.error);