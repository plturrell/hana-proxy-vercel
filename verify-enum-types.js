#!/usr/bin/env node
/**
 * Verify A2A and ORD enum types in Supabase
 */

import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function verifyEnumTypes() {
  console.log('🔍 VERIFYING A2A AND ORD ENUM TYPES');
  console.log('='.repeat(50));
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase configuration');
    return;
  }
  
  try {
    // Call the list_enum_types function we created
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_enum_types`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: '{}'
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Failed to query enum types:', error);
      
      // Try a simpler query
      console.log('\n🔍 Trying direct table query...');
      const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/a2a_agents?select=agent_id&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (tablesResponse.ok) {
        console.log('✅ Database connection successful');
      } else {
        console.log('❌ Database connection failed');
      }
      
      return;
    }
    
    const enumTypes = await response.json();
    
    if (Array.isArray(enumTypes) && enumTypes.length > 0) {
      console.log(`✅ Found ${enumTypes.length} enum types:\n`);
      
      // Group by type
      const a2aTypes = enumTypes.filter(e => e.enum_name.startsWith('a2a_'));
      const ordTypes = enumTypes.filter(e => e.enum_name.startsWith('ord_'));
      const otherTypes = enumTypes.filter(e => !e.enum_name.startsWith('a2a_') && !e.enum_name.startsWith('ord_'));
      
      if (a2aTypes.length > 0) {
        console.log('🤖 A2A ENUM TYPES:');
        a2aTypes.forEach(enumType => {
          console.log(`   ${enumType.enum_name}:`);
          console.log(`   └─ [${enumType.enum_values.slice(0, 3).join(', ')}${enumType.enum_values.length > 3 ? ', ...' : ''}] (${enumType.enum_values.length} values)`);
        });
      }
      
      if (ordTypes.length > 0) {
        console.log('\n📋 ORD ENUM TYPES:');
        ordTypes.forEach(enumType => {
          console.log(`   ${enumType.enum_name}:`);
          console.log(`   └─ [${enumType.enum_values.slice(0, 3).join(', ')}${enumType.enum_values.length > 3 ? ', ...' : ''}] (${enumType.enum_values.length} values)`);
        });
      }
      
      if (otherTypes.length > 0) {
        console.log('\n🔧 OTHER ENUM TYPES:');
        otherTypes.forEach(enumType => {
          console.log(`   ${enumType.enum_name}:`);
          console.log(`   └─ [${enumType.enum_values.slice(0, 3).join(', ')}${enumType.enum_values.length > 3 ? ', ...' : ''}] (${enumType.enum_values.length} values)`);
        });
      }
      
      console.log('\n📊 SUMMARY:');
      console.log(`   A2A types: ${a2aTypes.length}`);
      console.log(`   ORD types: ${ordTypes.length}`);
      console.log(`   Other types: ${otherTypes.length}`);
      console.log(`   Total: ${enumTypes.length}`);
      
      console.log('\n🏆 ENUM TYPES SUCCESSFULLY CREATED IN DATABASE!');
      
    } else {
      console.log('⚠️  No enum types found');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifyEnumTypes();