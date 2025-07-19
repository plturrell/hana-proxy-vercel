/**
 * Deploy Analytics Agents with ORD and A2A to Supabase
 * Creates 32 analytics agents with full resource discovery and communication
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Disable SSL certificate verification for Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || 
  'postgres://postgres.qupqqlxhtnoljlnkfpmc:hVaZqHWCjz3i1gj1@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function deployAnalyticsAgents() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    // Read SQL files
    console.log('\n📄 Reading SQL files...');
    const createAgentsSQL = await fs.readFile(
      path.join(__dirname, 'database', 'create-analytics-agents.sql'), 
      'utf8'
    );
    const createOrdA2aSQL = await fs.readFile(
      path.join(__dirname, 'database', 'create-analytics-agents-ord-a2a.sql'), 
      'utf8'
    );
    
    // Deploy agents first
    console.log('\n🤖 Creating 32 Analytics Agents...');
    await client.query(createAgentsSQL);
    console.log('✅ Analytics agents created');
    
    // Deploy ORD and A2A structures
    console.log('\n🔍 Creating ORD resources and A2A communications...');
    await client.query(createOrdA2aSQL);
    console.log('✅ ORD and A2A structures created');
    
    // Verify deployment
    console.log('\n📊 Verifying deployment...');
    
    const agentCount = await client.query(
      "SELECT COUNT(*) as count FROM a2a_agents WHERE type = 'analytics'"
    );
    console.log(`✅ Analytics Agents: ${agentCount.rows[0].count}`);
    
    const ordCount = await client.query(
      "SELECT COUNT(*) as count FROM ord_analytics_resources"
    );
    console.log(`✅ ORD Resources: ${ordCount.rows[0].count}`);
    
    const prdordCount = await client.query(
      "SELECT COUNT(*) as count FROM prdord_analytics"
    );
    console.log(`✅ Production Orders: ${prdordCount.rows[0].count}`);
    
    const a2aCount = await client.query(
      "SELECT COUNT(*) as count FROM a2a_analytics_communications"
    );
    console.log(`✅ A2A Communications: ${a2aCount.rows[0].count}`);
    
    // Show sample agents
    console.log('\n📋 Sample Analytics Agents:');
    const sampleAgents = await client.query(
      "SELECT agent_id, name, voting_power FROM a2a_agents WHERE type = 'analytics' ORDER BY voting_power DESC LIMIT 5"
    );
    
    sampleAgents.rows.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name} (${agent.agent_id}) - Power: ${agent.voting_power}`);
    });
    
    // Check agent capabilities
    console.log('\n🎯 Agent Capabilities Summary:');
    const capabilities = await client.query(`
      SELECT 
        json_object_agg(
          capability, 
          count
        ) as capability_summary
      FROM (
        SELECT 
          unnest(capabilities) as capability,
          COUNT(*) as count
        FROM a2a_agents
        WHERE type = 'analytics'
        GROUP BY unnest(capabilities)
        ORDER BY count DESC
        LIMIT 10
      ) sub
    `);
    
    if (capabilities.rows[0].capability_summary) {
      console.log(JSON.stringify(capabilities.rows[0].capability_summary, null, 2));
    }
    
    console.log('\n🎉 Analytics agents deployment complete!');
    console.log('📊 Total: 32 analytics agents with ORD and A2A support');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    if (error.detail) console.error('Details:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run deployment
console.log('🚀 Starting Analytics Agents Deployment');
console.log('📍 Target: Supabase PostgreSQL');
console.log('🎯 Goal: Deploy 32 analytics agents with ORD and A2A');
console.log('='.repeat(50));

deployAnalyticsAgents()
  .then(() => {
    console.log('\n✨ Deployment successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Deployment error:', error);
    process.exit(1);
  });