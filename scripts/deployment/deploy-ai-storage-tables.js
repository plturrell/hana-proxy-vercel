/**
 * Deploy AI Storage Tables
 * Creates missing tables for storing structured AI outputs
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direct PostgreSQL connection for DDL operations
const { Client } = pg;

async function deployTables() {
  console.log('🚀 Deploying AI Storage Tables...\n');

  // Construct PostgreSQL connection from Supabase
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  // Extract project ref from Supabase URL
  const projectRef = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error('❌ Invalid Supabase URL');
    process.exit(1);
  }

  // Construct database URL
  const dbPassword = 'FKJdfui3hf3h49fhe9fhe39'; // Production password from earlier in conversation
  const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-ai-storage-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Extract table/object name for logging
      const createMatch = statement.match(/CREATE\s+(TABLE|INDEX|VIEW|FUNCTION)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)/i);
      const objectName = createMatch ? createMatch[2] : `Statement ${i + 1}`;
      
      try {
        await client.query(statement);
        console.log(`✅ Created: ${objectName}`);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Skipped: ${objectName} (already exists)`);
          successCount++;
        } else {
          console.error(`❌ Failed: ${objectName}`);
          console.error(`   Error: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Deployment Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    // Verify tables were created
    console.log('\n🔍 Verifying created tables...\n');
    
    const verifyQuery = `
      SELECT table_name, 
             pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name IN (
          'market_predictions',
          'compliance_predictions',
          'compliance_prediction_details',
          'ai_analysis_log',
          'market_anomalies',
          'anomaly_details',
          'ai_recommendations',
          'technical_indicators',
          'market_risks'
        )
      ORDER BY table_name;
    `;

    const result = await client.query(verifyQuery);
    
    if (result.rows.length > 0) {
      console.log('📋 AI Storage Tables:');
      console.log('─'.repeat(60));
      result.rows.forEach(row => {
        console.log(`📊 ${row.table_name.padEnd(30)} | ${row.column_count} columns | ${row.size}`);
      });
    }

    // Check for views
    const viewQuery = `
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'public' 
        AND viewname IN ('latest_market_predictions', 'compliance_status');
    `;
    
    const viewResult = await client.query(viewQuery);
    if (viewResult.rows.length > 0) {
      console.log('\n📋 Views:');
      viewResult.rows.forEach(row => {
        console.log(`👁️  ${row.viewname}`);
      });
    }

    // Test Supabase connection
    console.log('\n🔗 Testing Supabase access...\n');
    
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Test write access
    const testData = {
      analysis_type: 'deployment_test',
      entity_id: 'test-123',
      agent_id: 'agent-deployment-test',
      ai_model: 'grok-4-0709',
      ai_response: { test: true, timestamp: new Date().toISOString() }
    };

    const { data, error } = await supabase
      .from('ai_analysis_log')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase write test failed:', error.message);
    } else {
      console.log('✅ Supabase write test successful');
      
      // Clean up test data
      await supabase
        .from('ai_analysis_log')
        .delete()
        .eq('id', data.id);
    }

    console.log('\n✨ AI Storage Tables deployment complete!');

  } catch (error) {
    console.error('💥 Deployment failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run deployment
deployTables().catch(console.error);