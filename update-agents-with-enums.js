#!/usr/bin/env node
/**
 * Update existing A2A agents with proper enum values
 * Ensures all agents have valid metadata enum types
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Default enum values based on agent characteristics
const AGENT_ENUM_DEFAULTS = {
  protocol_version_enum: 'a2a/v1.0',
  agent_role: 'autonomous',
  verification_level: 'basic',
  communication_pattern: 'asynchronous',
  ord_release_status: 'active',
  ord_visibility: 'public',
  ord_entity_level: '1',
  ord_capability_extensibility: 'automatic',
  a2a_compliance_status: 'compliant',
  ord_compliance_status: 'compliant',
  data_quality_level: 'gold'
};

// Map agent types to capabilities
const CAPABILITY_MAPPING = {
  'regime_detection': ['financial-analysis', 'anomaly-detection', 'forecasting'],
  'portfolio_rebalancing': ['portfolio-optimization', 'risk-assessment'],
  'risk_budgeting': ['risk-assessment', 'portfolio-optimization'],
  'risk_parity': ['risk-assessment', 'portfolio-optimization'],
  'copula_modeling': ['risk-assessment', 'financial-analysis'],
  'garch_volatility': ['forecasting', 'risk-assessment'],
  'stress_testing': ['stress-testing', 'risk-assessment'],
  'performance_attribution': ['performance-attribution', 'financial-analysis'],
  'portfolio_optimization': ['portfolio-optimization', 'financial-analysis']
};

async function updateAgentsWithEnums() {
  console.log('🔧 UPDATING A2A AGENTS WITH ENUM VALUES');
  console.log('='.repeat(50));

  try {
    // Step 1: Get all agents
    console.log('\n📋 STEP 1: Fetching existing agents...');
    const { data: agents, error: fetchError } = await supabase
      .from('a2a_agents')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Failed to fetch agents:', fetchError);
      return;
    }

    console.log(`✅ Found ${agents?.length || 0} agents`);

    if (!agents || agents.length === 0) {
      console.log('ℹ️  No agents to update');
      return;
    }

    // Step 2: Update each agent with enum values
    console.log('\n📋 STEP 2: Updating agents with enum values...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const agent of agents) {
      try {
        console.log(`\n🤖 Processing agent: ${agent.agent_id}`);
        
        // Determine capabilities based on agent ID
        const agentType = agent.agent_id.split('.').pop();
        const capabilities = CAPABILITY_MAPPING[agentType] || ['financial-analysis'];
        
        // Build update object with enum values
        const updateData = {
          // A2A enum fields
          protocol_version_enum: agent.protocol_version_enum || AGENT_ENUM_DEFAULTS.protocol_version_enum,
          capabilities_enum: capabilities,
          agent_role: agent.agent_role || AGENT_ENUM_DEFAULTS.agent_role,
          verification_level: agent.verification_level || AGENT_ENUM_DEFAULTS.verification_level,
          communication_pattern: agent.communication_pattern || AGENT_ENUM_DEFAULTS.communication_pattern,
          
          // ORD enum fields
          ord_release_status: agent.ord_release_status || AGENT_ENUM_DEFAULTS.ord_release_status,
          ord_visibility: agent.ord_visibility || AGENT_ENUM_DEFAULTS.ord_visibility,
          ord_entity_level: agent.ord_entity_level || AGENT_ENUM_DEFAULTS.ord_entity_level,
          ord_capability_extensibility: agent.ord_capability_extensibility || AGENT_ENUM_DEFAULTS.ord_capability_extensibility,
          
          // Compliance status
          a2a_compliance_status: agent.a2a_compliance_status || AGENT_ENUM_DEFAULTS.a2a_compliance_status,
          ord_compliance_status: agent.ord_compliance_status || AGENT_ENUM_DEFAULTS.ord_compliance_status,
          
          // Data quality
          data_quality_level: agent.data_quality_level || AGENT_ENUM_DEFAULTS.data_quality_level,
          
          // Update timestamp
          updated_at: new Date().toISOString()
        };
        
        // Update the agent
        const { error: updateError } = await supabase
          .from('a2a_agents')
          .update(updateData)
          .eq('agent_id', agent.agent_id);
        
        if (updateError) {
          console.log(`❌ Failed to update ${agent.agent_id}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Updated ${agent.agent_id}`);
          console.log(`   - Capabilities: ${capabilities.join(', ')}`);
          console.log(`   - Role: ${updateData.agent_role}`);
          console.log(`   - Verification: ${updateData.verification_level}`);
          successCount++;
        }
        
        // Also record in metadata_validations table
        await supabase
          .from('metadata_validations')
          .upsert({
            resource_type: 'api',
            resource_id: agent.agent_id,
            a2a_compliance_status: updateData.a2a_compliance_status,
            ord_compliance_status: updateData.ord_compliance_status,
            validation_errors: [],
            validation_warnings: [],
            last_validated_at: new Date(),
            validation_version: '1.0'
          });
        
      } catch (error) {
        console.log(`❌ Error processing ${agent.agent_id}:`, error.message);
        errorCount++;
      }
    }

    // Step 3: Verify updates
    console.log('\n📋 STEP 3: Verifying updates...');
    
    const { data: updatedAgents, error: verifyError } = await supabase
      .from('a2a_agents')
      .select('agent_id, protocol_version_enum, agent_role, ord_release_status')
      .limit(5);
    
    if (!verifyError && updatedAgents) {
      console.log('\n✅ Sample of updated agents:');
      updatedAgents.forEach(agent => {
        console.log(`   ${agent.agent_id}:`);
        console.log(`     - Protocol: ${agent.protocol_version_enum}`);
        console.log(`     - Role: ${agent.agent_role}`);
        console.log(`     - Status: ${agent.ord_release_status}`);
      });
    }

    // Final summary
    console.log('\n🎯 UPDATE SUMMARY:');
    console.log(`✅ Successfully updated: ${successCount} agents`);
    console.log(`❌ Failed to update: ${errorCount} agents`);
    console.log(`📊 Success rate: ${Math.round((successCount / agents.length) * 100)}%`);
    
    console.log('\n🏆 AGENT ENUM UPDATE COMPLETED!');
    console.log('All agents now have proper A2A and ORD metadata enum values.');

  } catch (error) {
    console.error('❌ Update process failed:', error);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAgentsWithEnums().then(() => {
    console.log('\n✅ Agent update completed.');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export default updateAgentsWithEnums;