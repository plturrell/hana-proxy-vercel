import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Supabase connection...\n');

// Check environment variables
console.log('Environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Not set');
console.log('GROK_API_KEY:', process.env.GROK_API_KEY ? '✅ Set' : '❌ Not set');
console.log('XAI_API_KEY:', process.env.XAI_API_KEY ? '✅ Set' : '❌ Not set');

// Test Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
  try {
    // Test a simple query
    const { data, error } = await supabase
      .from('ai_analysis_log')
      .select('count()')
      .single();

    if (error) {
      console.log('\n❌ Supabase connection failed:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('\n✅ Supabase connection successful!');
      console.log('ai_analysis_log table is accessible');
    }

    // Test insert
    const testData = {
      analysis_type: 'connection_test',
      entity_id: 'TEST',
      agent_id: 'test-script',
      ai_response: { test: true, timestamp: new Date().toISOString() }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('ai_analysis_log')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('\n❌ Insert failed:', insertError.message);
    } else {
      console.log('✅ Insert successful!');
      console.log('Record ID:', insertData[0].id);

      // Clean up
      await supabase
        .from('ai_analysis_log')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Test data cleaned up');
    }

  } catch (err) {
    console.error('\n❌ Connection test failed:', err.message);
  }
}

testConnection();