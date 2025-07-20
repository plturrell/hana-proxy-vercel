#!/usr/bin/env node

/**
 * Setup Supabase Vault Secrets
 * Inserts API keys from .env file into Supabase Vault
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupVaultSecrets() {
  console.log('🔐 Setting up Supabase Vault secrets...\n');

  // First, create the vault schema and functions if they don't exist
  console.log('📋 Creating vault schema...');
  const { error: schemaError } = await supabase.rpc('exec_sql', {
    sql: `
      -- Enable vault extension if not exists
      CREATE EXTENSION IF NOT EXISTS vault;
      
      -- Create get_secret function if not exists
      CREATE OR REPLACE FUNCTION vault.get_secret(p_name TEXT)
      RETURNS TEXT AS $$
      BEGIN
        -- For now, return from environment variables until vault is properly set up
        CASE p_name
          WHEN 'perplexity_api_key' THEN RETURN '${process.env.PERPLEXITY_API_KEY}';
          WHEN 'grok_api_key' THEN RETURN '${process.env.GROK_API_KEY}';
          WHEN 'openai_api_key' THEN RETURN '${process.env.OPENAI_API_KEY}';
          WHEN 'fmp_api_key' THEN RETURN '${process.env.FMP_API_KEY}';
          WHEN 'finnhub_api_key' THEN RETURN '${process.env.FINNHUB_API_KEY}';
          ELSE RETURN NULL;
        END CASE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      GRANT EXECUTE ON FUNCTION vault.get_secret TO anon, authenticated, service_role;
    `
  });

  if (schemaError) {
    console.error('❌ Failed to create vault schema:', schemaError.message);
    console.log('\n💡 Alternative: Run this SQL directly in Supabase dashboard:\n');
    console.log(`-- Copy and paste this into SQL editor --
CREATE EXTENSION IF NOT EXISTS vault;

-- Temporary function that returns environment variables
CREATE OR REPLACE FUNCTION vault.get_secret(p_name TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE p_name
    WHEN 'perplexity_api_key' THEN RETURN '${process.env.PERPLEXITY_API_KEY}';
    WHEN 'grok_api_key' THEN RETURN '${process.env.GROK_API_KEY}';
    WHEN 'openai_api_key' THEN RETURN '${process.env.OPENAI_API_KEY || 'sk-placeholder'}';
    WHEN 'fmp_api_key' THEN RETURN '${process.env.FMP_API_KEY}';
    WHEN 'finnhub_api_key' THEN RETURN '${process.env.FINNHUB_API_KEY}';
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION vault.get_secret TO anon, authenticated, service_role;
    `);
  } else {
    console.log('✅ Vault schema created successfully');
  }

  // Test the vault function
  console.log('\n🧪 Testing vault access...');
  const secrets = [
    { name: 'perplexity_api_key', envVar: 'PERPLEXITY_API_KEY' },
    { name: 'grok_api_key', envVar: 'GROK_API_KEY' },
    { name: 'openai_api_key', envVar: 'OPENAI_API_KEY' },
    { name: 'fmp_api_key', envVar: 'FMP_API_KEY' },
    { name: 'finnhub_api_key', envVar: 'FINNHUB_API_KEY' }
  ];

  for (const secret of secrets) {
    try {
      const { data, error } = await supabase.rpc('get_secret', { p_name: secret.name });
      if (error) {
        console.log(`❌ ${secret.name}: Failed to retrieve - ${error.message}`);
      } else if (data) {
        console.log(`✅ ${secret.name}: Available (${data.substring(0, 10)}...)`);
      } else {
        console.log(`⚠️  ${secret.name}: Not set`);
      }
    } catch (e) {
      console.log(`❌ ${secret.name}: Error - ${e.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log('- Perplexity API Key:', process.env.PERPLEXITY_API_KEY ? '✅ Available' : '❌ Missing');
  console.log('- Grok API Key:', process.env.GROK_API_KEY ? '✅ Available' : '❌ Missing');
  console.log('- OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Available' : '⚠️ Using placeholder');
  console.log('- FMP API Key:', process.env.FMP_API_KEY ? '✅ Available' : '❌ Missing');
  console.log('- Finnhub API Key:', process.env.FINNHUB_API_KEY ? '✅ Available' : '❌ Missing');

  console.log('\n🚀 Next Steps:');
  console.log('1. Deploy the updated code that uses vault.get_secret()');
  console.log('2. Update API endpoints to fetch secrets from vault');
  console.log('3. Remove hardcoded environment variable references');
}

setupVaultSecrets().catch(console.error);