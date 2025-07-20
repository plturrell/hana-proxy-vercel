#!/usr/bin/env node
/**
 * Check existing enum types in Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkEnumTypes() {
  console.log('🔍 CHECKING EXISTING ENUM TYPES IN DATABASE');
  console.log('='.repeat(50));
  
  try {
    // Query to check existing enum types
    const checkEnumsSQL = `
      SELECT 
        n.nspname as schema,
        t.typname as name,
        t.typtype as type,
        CASE t.typtype
          WHEN 'e' THEN 'enum'
          ELSE t.typtype::text
        END as type_desc
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typtype = 'e'
      AND n.nspname = 'public'
      ORDER BY t.typname;
    `;
    
    // Execute via supabase-js
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_statement: checkEnumsSQL
    });
    
    if (error) {
      console.log('❌ Error checking enums:', error);
      
      // Try alternative approach - check if any A2A or ORD tables exist
      console.log('\n🔍 Checking for A2A/ORD related tables...');
      
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .or('table_name.ilike.%a2a%,table_name.ilike.%ord%')
        .limit(10);
        
      if (tableError) {
        console.log('❌ Cannot access database schema:', tableError.message);
      } else if (tables?.length > 0) {
        console.log('✅ Found related tables:');
        tables.forEach(t => console.log(`   - ${t.table_name}`));
      } else {
        console.log('ℹ️  No A2A/ORD related tables found');
      }
      
      return [];
    }
    
    if (data && Array.isArray(data)) {
      console.log(`✅ Found ${data.length} enum types in public schema:`);
      data.forEach(enumType => {
        console.log(`   - ${enumType.name} (${enumType.type_desc})`);
      });
      return data.map(e => e.name);
    } else {
      console.log('ℹ️  No enum types found in public schema');
      return [];
    }
    
  } catch (error) {
    console.error('❌ Failed to check enum types:', error);
    return [];
  }
}

// Check specific enum values
async function checkEnumValues(enumName) {
  try {
    const checkValuesSQL = `
      SELECT enumlabel 
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = '${enumName}'
      ORDER BY e.enumsortorder;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_statement: checkValuesSQL
    });
    
    if (!error && data) {
      return data.map(row => row.enumlabel);
    }
    return [];
  } catch (error) {
    return [];
  }
}

// Execute check
checkEnumTypes().then(async (existingEnums) => {
  console.log('\n📊 SUMMARY:');
  
  const a2aEnums = existingEnums.filter(e => e.startsWith('a2a_'));
  const ordEnums = existingEnums.filter(e => e.startsWith('ord_'));
  const otherEnums = existingEnums.filter(e => !e.startsWith('a2a_') && !e.startsWith('ord_'));
  
  console.log(`   A2A enum types: ${a2aEnums.length}`);
  console.log(`   ORD enum types: ${ordEnums.length}`);
  console.log(`   Other enum types: ${otherEnums.length}`);
  
  if (a2aEnums.length > 0) {
    console.log('\n🤖 Existing A2A enums:');
    for (const enumName of a2aEnums) {
      const values = await checkEnumValues(enumName);
      console.log(`   - ${enumName}: [${values.slice(0, 3).join(', ')}${values.length > 3 ? '...' : ''}]`);
    }
  }
  
  if (ordEnums.length > 0) {
    console.log('\n📋 Existing ORD enums:');
    for (const enumName of ordEnums) {
      const values = await checkEnumValues(enumName);
      console.log(`   - ${enumName}: [${values.slice(0, 3).join(', ')}${values.length > 3 ? '...' : ''}]`);
    }
  }
  
  console.log('\n✅ Check complete');
  process.exit(0);
});