#!/usr/bin/env node

import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.qupqqlxhtnoljlnkfpmc',
  password: 'hVaZqHWCjz3i1gj1',
  ssl: false
});

async function deployDeepResearchTable() {
  console.log('🚀 Adding Deep Research Table...\n');

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const sqlContent = fs.readFileSync('./add-deep-research-table.sql', 'utf8');
    
    console.log('📋 Creating deep research table...');
    await client.query(sqlContent);
    console.log('✅ Deep research table created successfully\n');

    // Verify table was created
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'deep_research_reports'
      )
    `);

    if (result.rows[0].exists) {
      console.log('✅ deep_research_reports table verified');
      console.log('\n🎉 DEEP RESEARCH CAPABILITIES ADDED!');
      console.log('\n🚀 New Advanced Features Available:');
      console.log('   • Comprehensive company research');
      console.log('   • Deep market analysis');
      console.log('   • Multi-source risk assessment');
      console.log('   • Investment due diligence');
      console.log('   • Competitive intelligence');
      console.log('\n📊 Research powered by hundreds of sources');
    } else {
      console.log('❌ Table verification failed');
    }

  } catch (error) {
    console.log(`❌ Deployment failed: ${error.message}`);
  } finally {
    await client.end();
  }
}

deployDeepResearchTable().catch(console.error);