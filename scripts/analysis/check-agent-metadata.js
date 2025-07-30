/**
 * Check Existing Agent Metadata Structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkAgentMetadata() {
  console.log('🔍 Checking Existing Agent Metadata Structure');
  console.log('==============================================\n');

  try {
    // 1. Check a2a_agents table structure
    console.log('1. A2A Agents Table Structure:');
    console.log('-------------------------------');
    
    const { data: agents, error: agentsError } = await supabase
      .from('a2a_agents')
      .select('*')
      .limit(3);
    
    if (agentsError) {
      console.log('❌ Error fetching agents:', agentsError.message);
    } else if (agents && agents.length > 0) {
      console.log('✅ Sample agent structure:');
      const sampleAgent = agents[0];
      console.log('Agent Keys:', Object.keys(sampleAgent));
      console.log('\nSample Agent Data:');
      console.log(JSON.stringify(sampleAgent, null, 2));
    } else {
      console.log('⚠️ No agents found');
    }

    // 2. Check for any metadata-related tables
    console.log('\n2. Checking for Metadata Tables:');
    console.log('--------------------------------');
    
    // Check if there's a dedicated metadata table
    const { data: metadataTable, error: metaError } = await supabase
      .from('agent_metadata')
      .select('*')
      .limit(1);
    
    if (metaError) {
      console.log('⚠️ No agent_metadata table found');
    } else {
      console.log('✅ Found agent_metadata table');
      if (metadataTable && metadataTable.length > 0) {
        console.log('Sample metadata:', JSON.stringify(metadataTable[0], null, 2));
      }
    }

    // 3. Check for capabilities or custom_data fields
    console.log('\n3. Current Agent Fields Analysis:');
    console.log('---------------------------------');
    
    if (agents && agents.length > 0) {
      const fields = Object.keys(agents[0]);
      console.log('All agent fields:');
      fields.forEach(field => {
        const value = agents[0][field];
        const type = typeof value;
        const isJson = type === 'object' && value !== null;
        console.log(`  • ${field}: ${type}${isJson ? ' (JSON object)' : ''}`);
        
        if (isJson) {
          console.log(`    Keys: ${Object.keys(value).join(', ')}`);
        }
      });
    }

    // 4. Check for blockchain-related fields
    console.log('\n4. Blockchain-related Fields:');
    console.log('-----------------------------');
    
    if (agents && agents.length > 0) {
      const blockchainFields = Object.keys(agents[0]).filter(key => 
        key.toLowerCase().includes('blockchain') || 
        key.toLowerCase().includes('wallet') ||
        key.toLowerCase().includes('crypto') ||
        key.toLowerCase().includes('contract')
      );
      
      if (blockchainFields.length > 0) {
        console.log('✅ Found blockchain-related fields:');
        blockchainFields.forEach(field => {
          console.log(`  • ${field}:`, agents[0][field]);
        });
      } else {
        console.log('⚠️ No blockchain-related fields found');
      }
    }

    // 5. Check for any custom_data or metadata JSON fields
    console.log('\n5. Custom Data Fields:');
    console.log('---------------------');
    
    if (agents && agents.length > 0) {
      const customFields = Object.keys(agents[0]).filter(key => 
        key.toLowerCase().includes('custom') || 
        key.toLowerCase().includes('metadata') ||
        key.toLowerCase().includes('config') ||
        key.toLowerCase().includes('properties')
      );
      
      if (customFields.length > 0) {
        console.log('✅ Found custom data fields:');
        customFields.forEach(field => {
          const value = agents[0][field];
          console.log(`  • ${field}:`, typeof value === 'object' ? JSON.stringify(value, null, 4) : value);
        });
      } else {
        console.log('⚠️ No custom data fields found');
      }
    }

    // 6. Check database schema info
    console.log('\n6. Database Schema Information:');
    console.log('-------------------------------');
    
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'a2a_agents' })
      .select();
    
    if (!schemaError && schemaInfo) {
      console.log('✅ Table columns with types:');
      schemaInfo.forEach(col => {
        console.log(`  • ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('⚠️ Could not fetch schema info');
    }

    // 7. Count total agents
    console.log('\n7. Agent Statistics:');
    console.log('-------------------');
    
    const { count } = await supabase
      .from('a2a_agents')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total agents: ${count}`);
    
    const { data: activeAgents } = await supabase
      .from('a2a_agents')
      .select('status')
      .eq('status', 'active');
    
    console.log(`Active agents: ${activeAgents?.length || 0}`);

    return {
      success: true,
      totalAgents: count,
      activeAgents: activeAgents?.length || 0,
      sampleAgent: agents?.[0] || null,
      agentFields: agents?.[0] ? Object.keys(agents[0]) : []
    };

  } catch (error) {
    console.error('❌ Error checking metadata:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the check
checkAgentMetadata()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Metadata check completed successfully');
    } else {
      console.log(`\n❌ Metadata check failed: ${result.error}`);
    }
  });

module.exports = { checkAgentMetadata };
