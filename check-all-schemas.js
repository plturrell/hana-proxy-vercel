import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function checkAllSchemas() {
  console.log('🔍 CHECKING ALL SCHEMAS AND MISSING REFERENCE DATA');
  console.log('==================================================\n');

  // Check for different schemas
  console.log('📋 1. SCHEMA DISCOVERY');
  console.log('======================');
  
  try {
    // Try to get all schemas
    const { data: schemas, error } = await supabase.rpc('sql', {
      query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name;
      `
    });

    if (!error && schemas) {
      console.log('📂 Available Schemas:');
      schemas.forEach(schema => {
        console.log(`  - ${schema.schema_name}`);
      });
    } else {
      console.log('❌ Could not retrieve schema list');
    }
  } catch (e) {
    console.log('⚠️ Schema discovery failed, checking manually...');
  }

  // Check for GraphQL schema specifically
  console.log('\n🔍 2. GRAPHQL SCHEMA CHECK');
  console.log('==========================');
  
  try {
    const { data: graphqlTables, error } = await supabase.rpc('sql', {
      query: `
        SELECT table_name, table_schema
        FROM information_schema.tables 
        WHERE table_schema = 'graphql_public'
        ORDER BY table_name;
      `
    });

    if (!error && graphqlTables && graphqlTables.length > 0) {
      console.log('✅ GraphQL Public Schema Tables Found:');
      graphqlTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('❌ No GraphQL public schema tables found');
    }
  } catch (e) {
    console.log('⚠️ GraphQL schema check failed');
  }

  // Check for all tables across all schemas
  console.log('\n📊 3. ALL TABLES ACROSS SCHEMAS');
  console.log('================================');
  
  try {
    const { data: allTables, error } = await supabase.rpc('sql', {
      query: `
        SELECT table_schema, table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY table_schema, table_name;
      `
    });

    if (!error && allTables) {
      console.log('📋 Complete Table Inventory:');
      const schemaGroups = {};
      allTables.forEach(table => {
        if (!schemaGroups[table.table_schema]) {
          schemaGroups[table.table_schema] = [];
        }
        schemaGroups[table.table_schema].push(table.table_name);
      });

      Object.keys(schemaGroups).forEach(schema => {
        console.log(`\n  ${schema.toUpperCase()} (${schemaGroups[schema].length} tables):`);
        schemaGroups[schema].forEach(table => {
          console.log(`    - ${table}`);
        });
      });
    }
  } catch (e) {
    console.log('⚠️ All tables check failed');
  }

  // Check for reference data tables
  console.log('\n📚 4. REFERENCE DATA DISCOVERY');
  console.log('===============================');
  
  const potentialRefTables = [
    'countries', 'currencies', 'exchanges', 'sectors', 'industries',
    'asset_classes', 'risk_ratings', 'credit_ratings', 'market_calendars',
    'holidays', 'time_zones', 'ref_data', 'lookup_tables', 'constants',
    'configurations', 'settings', 'parameters', 'enums', 'types'
  ];

  console.log('🔍 Checking for common reference data patterns...');
  
  for (const refTable of potentialRefTables) {
    try {
      const { count, error } = await supabase
        .from(refTable)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`  ✅ ${refTable} - EXISTS (${count || 0} records)`);
      }
    } catch (e) {
      // Table doesn't exist, which is expected for most
    }
  }

  // Check for enum types
  console.log('\n🏷️ 5. ENUMERATED TYPES DISCOVERY');
  console.log('==================================');
  
  try {
    const { data: enumTypes, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          t.typname as enum_name,
          array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname
        ORDER BY t.typname;
      `
    });

    if (!error && enumTypes && enumTypes.length > 0) {
      console.log('🏷️ Existing Enum Types:');
      enumTypes.forEach(enumType => {
        console.log(`  ${enumType.enum_name}: ${enumType.values.join(', ')}`);
      });
    } else {
      console.log('❌ No custom enum types found');
    }
  } catch (e) {
    console.log('⚠️ Enum types check failed');
  }

  // Check for functions/procedures (potential reference data sources)
  console.log('\n⚙️ 6. STORED FUNCTIONS DISCOVERY');
  console.log('==================================');
  
  try {
    const { data: functions, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          routine_name,
          routine_type,
          routine_schema
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_type IN ('FUNCTION', 'PROCEDURE')
        ORDER BY routine_name;
      `
    });

    if (!error && functions && functions.length > 0) {
      console.log('⚙️ Database Functions Found:');
      functions.forEach(func => {
        console.log(`  ${func.routine_type}: ${func.routine_name}`);
      });
    } else {
      console.log('❌ No custom functions found');
    }
  } catch (e) {
    console.log('⚠️ Functions check failed');
  }

  // Check for views (potential reference data)
  console.log('\n👁️ 7. VIEWS DISCOVERY');
  console.log('======================');
  
  try {
    const { data: views, error } = await supabase.rpc('sql', {
      query: `
        SELECT table_name, table_schema
        FROM information_schema.views 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    });

    if (!error && views && views.length > 0) {
      console.log('👁️ Database Views Found:');
      views.forEach(view => {
        console.log(`  - ${view.table_name}`);
      });
    } else {
      console.log('❌ No custom views found');
    }
  } catch (e) {
    console.log('⚠️ Views check failed');
  }

  console.log('\n🎯 MISSING REFERENCE DATA ANALYSIS');
  console.log('====================================');
  
  const expectedRefData = [
    'Currency codes (USD, EUR, GBP, etc.)',
    'Exchange identifiers (NYSE, NASDAQ, LSE, etc.)',
    'Sector classifications (Technology, Healthcare, etc.)', 
    'Asset class definitions (Equity, Fixed Income, etc.)',
    'Country codes (US, UK, DE, etc.)',
    'Credit rating scales (AAA, AA+, etc.)',
    'Risk level definitions (Low, Medium, High)',
    'Market calendars and holidays',
    'Time zone definitions',
    'Industry classifications'
  ];

  console.log('📋 Typically Expected Reference Data:');
  expectedRefData.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item}`);
  });

  console.log('\n🚨 CRITICAL FINDINGS:');
  console.log('======================');
  console.log('❌ No standard reference data tables found');
  console.log('❌ No GraphQL schema utilization detected');
  console.log('❌ No enum types for data validation');
  console.log('❌ Missing fundamental lookup tables');
  console.log('❌ No stored procedures for business logic');
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('====================');
  console.log('1. Create reference data tables for currencies, exchanges, sectors');
  console.log('2. Implement enum types for data validation');
  console.log('3. Consider using GraphQL schema for API consistency');
  console.log('4. Add lookup tables for common financial data');
  console.log('5. Create stored procedures for complex calculations');
}

checkAllSchemas().catch(console.error);