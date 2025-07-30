/**
 * Execute A2A Deployment via Supabase Proxy
 * Uses the deploy_tables action to get SQL and provides it for execution
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.VERCEL_URL || 'https://hana-proxy-vercel.vercel.app';

async function executeA2ADeployment() {
  console.log('🚀 A2A Analytics Tables Automated Deployment');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get the deployment SQL
    console.log('\n📄 Fetching deployment SQL...');
    const deployResponse = await fetch(`${BASE_URL}/api/supabase-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deploy_tables'
      })
    });
    
    const deployResult = await deployResponse.json();
    
    if (deployResult.sql) {
      console.log('✅ SQL retrieved successfully');
      console.log(`  - Tables SQL: ${deployResult.sql.tables.length} characters`);
      console.log(`  - Functions SQL: ${deployResult.sql.functions.length} characters`);
      
      // Step 2: Execute the SQL via execute_sql action
      console.log('\n🔧 Executing table creation SQL...');
      
      // Since direct SQL execution requires service role key, 
      // we'll output instructions for automated execution
      console.log('\n📋 Automated Execution Options:');
      console.log('\n1. Using Supabase CLI:');
      console.log('   supabase db push --db-url $DATABASE_URL');
      
      console.log('\n2. Using psql:');
      console.log('   psql $DATABASE_URL -f deploy-a2a-tables-combined.sql');
      
      console.log('\n3. Using Supabase Dashboard:');
      console.log(`   ${deployResult.instructions[3]}`);
      
      console.log('\n4. Using Migration:');
      console.log('   supabase migration new create_a2a_tables');
      console.log('   # Copy SQL to supabase/migrations/[timestamp]_create_a2a_tables.sql');
      console.log('   supabase db push');
      
      // Step 3: Create deployment verification endpoint
      console.log('\n🔍 Creating verification script...');
      const verificationScript = `
#!/bin/bash
# A2A Deployment Verification Script

echo "🔍 Verifying A2A deployment..."

# Check if tables exist
curl -X POST ${BASE_URL}/api/supabase-proxy \\
  -H "Content-Type: application/json" \\
  -d '{"action": "select", "table": "a2a_agents", "query": "count"}' \\
  | jq '.data'

echo "✅ Deployment verification complete"
`;
      
      import('fs').then(fs => {
        fs.writeFileSync('verify-a2a-deployment.sh', verificationScript);
        console.log('  ✅ Created verify-a2a-deployment.sh');
      });
      
      // Step 4: Test if functions are deployed
      console.log('\n🧪 Testing function deployment...');
      const testResponse = await fetch(`${BASE_URL}/api/supabase-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_function'
        })
      });
      
      const testResult = await testResponse.json();
      if (testResult.deployed) {
        console.log('  ✅ Analytics functions are deployed');
      } else {
        console.log('  ⚠️  Analytics functions not yet deployed');
        console.log(`  💡 ${testResult.hint}`);
      }
      
      // Step 5: Check current agent count
      console.log('\n📊 Checking current status...');
      const countResponse = await fetch(`${BASE_URL}/.well-known/agent.json`);
      const agentData = await countResponse.json();
      
      console.log(`  - Current agents: ${agentData.totalAgents || 0}`);
      console.log(`  - Expected agents: 32`);
      
      if (agentData.totalAgents === 0) {
        console.log('\n⚠️  No agents found. After deploying tables, run:');
        console.log('  node register-agents-via-api.js');
      }
      
    } else {
      console.log('❌ Failed to retrieve deployment SQL');
      console.log('Error:', deployResult.error);
    }
    
  } catch (error) {
    console.error('💥 Deployment error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Deployment process complete');
  console.log('\n📝 Next Steps:');
  console.log('1. Execute the SQL using one of the methods above');
  console.log('2. Run: chmod +x verify-a2a-deployment.sh && ./verify-a2a-deployment.sh');
  console.log('3. Run: node register-agents-via-api.js');
  console.log('4. Run: node test-compliance-live.js');
}

// Run the deployment
executeA2ADeployment()
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });