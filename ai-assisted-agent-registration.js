/**
 * AI-Assisted Agent Registration Process
 * Uses XAI API to ensure full A2A and ORD compliance
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const BASE_URL = 'https://hana-proxy-vercel.vercel.app';
const XAI_API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY;

// A2A and ORD compliance requirements
const COMPLIANCE_REQUIREMENTS = {
  a2a: {
    required_fields: [
      'name', 'description', 'id', 'version', 'protocolVersion',
      'capabilities', 'inputSchema', 'outputSchema', 'endpoints',
      'authentication', 'rateLimit', 'metadata'
    ],
    protocol_version: 'a2a/v1',
    endpoints: ['message/send', 'message/stream', 'task/create'],
    authentication_methods: ['bearer', 'api-key']
  },
  ord: {
    required_metadata: [
      'ordId', 'title', 'shortDescription', 'description',
      'version', 'releaseStatus', 'visibility', 'partOfPackage'
    ],
    namespace_format: /^urn:[^:]+:[^:]+:capability:[^:]+:v\d+$/,
    description_format: 'markdown',
    api_protocol: 'rest'
  }
};

/**
 * Use XAI to enhance agent metadata for compliance
 */
async function enhanceAgentWithAI(agent) {
  console.log(`\n🤖 Enhancing agent: ${agent.name}`);
  
  const prompt = `You are an AI compliance assistant helping to register financial analytics agents for A2A (Agent-to-Agent) and ORD (Open Resource Discovery) compliance.

Current agent data:
${JSON.stringify(agent, null, 2)}

A2A Requirements:
- Must have clear capabilities list (what the agent can do)
- Must have input/output schemas for API operations
- Must have proper authentication configuration
- Must have rate limiting configuration
- Must have comprehensive metadata

ORD Requirements:
- Must have proper URN namespace (urn:finsight:analytics:capability:${agent.agent_id}:v1)
- Must have markdown-formatted description explaining the agent's purpose and how to use it
- Must have proper categorization (package assignment, group membership)
- Must have clear API documentation

Please provide enhanced metadata for this agent that ensures full compliance. Return a JSON object with the following structure:
{
  "enhanced_description": "Detailed markdown description",
  "capabilities": ["capability1", "capability2", ...],
  "inputSchema": { /* JSON schema for inputs */ },
  "outputSchema": { /* JSON schema for outputs */ },
  "goals": ["goal1", "goal2", ...],
  "personality_traits": ["trait1", "trait2", ...],
  "collaboration_preferences": { /* how this agent works with others */ },
  "performance_metrics": { /* what metrics this agent tracks */ },
  "compliance_notes": "Any specific compliance considerations"
}`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are a compliance expert for financial analytics systems. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`XAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const enhanced = JSON.parse(content);
    return enhanced;
  } catch (error) {
    console.error(`❌ AI enhancement failed for ${agent.name}:`, error.message);
    // Return default enhancements if AI fails
    return generateDefaultEnhancements(agent);
  }
}

/**
 * Generate default enhancements if AI is unavailable
 */
function generateDefaultEnhancements(agent) {
  const agentType = agent.agent_id.replace('agent-', '').replace(/-/g, ' ');
  
  return {
    enhanced_description: `# ${agent.name}\n\n${agent.description}\n\n## Usage\nThis agent provides ${agentType} calculations for financial analysis.\n\n## Integration\nUse the A2A protocol endpoints to interact with this agent.`,
    capabilities: agent.capabilities || ['calculate', 'analyze', 'validate'],
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'number' } },
        parameters: { type: 'object' }
      },
      required: ['data']
    },
    outputSchema: {
      type: 'object',
      properties: {
        result: { type: 'number' },
        confidence: { type: 'number' },
        metadata: { type: 'object' }
      },
      required: ['result']
    },
    goals: ['accurate_analysis', 'efficient_processing', 'clear_communication'],
    personality_traits: ['analytical', 'precise', 'collaborative'],
    collaboration_preferences: {
      preferred_partners: [],
      communication_style: 'formal',
      negotiation_approach: 'data-driven'
    },
    performance_metrics: {
      accuracy_threshold: 0.95,
      response_time_ms: 1000,
      success_rate_target: 0.99
    },
    compliance_notes: 'Standard financial analytics compliance'
  };
}

/**
 * Validate agent compliance
 */
function validateCompliance(agent, enhanced) {
  const issues = [];
  
  // A2A validation
  if (!agent.capabilities || agent.capabilities.length === 0) {
    issues.push('Missing capabilities for A2A compliance');
  }
  
  if (!enhanced.inputSchema || !enhanced.outputSchema) {
    issues.push('Missing input/output schemas for A2A compliance');
  }
  
  // ORD validation
  const ordId = `urn:finsight:analytics:capability:${agent.agent_id}:v1`;
  if (!COMPLIANCE_REQUIREMENTS.ord.namespace_format.test(ordId)) {
    issues.push('Invalid ORD namespace format');
  }
  
  if (!enhanced.enhanced_description || enhanced.enhanced_description.length < 50) {
    issues.push('Description too short for ORD compliance');
  }
  
  return {
    isCompliant: issues.length === 0,
    issues
  };
}

/**
 * Register agent through the A2A registry
 */
async function registerAgent(agent, enhanced) {
  console.log(`\n📝 Registering ${agent.name} through A2A registry...`);
  
  const registrationData = {
    action: 'register',
    agent_id: agent.agent_id,
    name: agent.name,
    type: agent.type || 'analytics',
    description: enhanced.enhanced_description || agent.description,
    capabilities: enhanced.capabilities || agent.capabilities,
    goals: enhanced.goals || agent.goals,
    personality: agent.personality,
    voting_power: agent.voting_power || 100,
    metadata: {
      inputSchema: enhanced.inputSchema,
      outputSchema: enhanced.outputSchema,
      collaboration_preferences: enhanced.collaboration_preferences,
      performance_metrics: enhanced.performance_metrics,
      ord: {
        namespace: `urn:finsight:analytics:capability:${agent.agent_id}:v1`,
        package: agent.agent_id.includes('advanced') ? 
          'urn:finsight:analytics:package:advanced-analytics:v1' : 
          'urn:finsight:analytics:package:core-analytics:v1'
      }
    }
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/a2a-agent-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(registrationData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Successfully registered ${agent.name}`);
      return { success: true, agent: result.agent };
    } else {
      console.log(`❌ Registration failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.log(`❌ Registration error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Onboard agent to blockchain after registration
 */
async function onboardAgent(agentId) {
  console.log(`\n🔗 Onboarding ${agentId} to blockchain...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/a2a-agent-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'onboard',
        agent_id: agentId
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Successfully onboarded to blockchain`);
      console.log(`   Transaction: ${result.transaction_hash}`);
      return true;
    } else {
      console.log(`❌ Onboarding failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Onboarding error: ${error.message}`);
    return false;
  }
}

/**
 * Main registration process
 */
async function runAIAssistedRegistration() {
  console.log('🚀 Starting AI-Assisted Agent Registration Process');
  console.log('📍 Ensuring A2A and ORD compliance for all agents');
  console.log('='.repeat(60));
  
  if (!XAI_API_KEY) {
    console.log('⚠️  Warning: XAI_API_KEY not found, using default enhancements');
  }
  
  // Fetch all analytics agents
  const { data: agents, error } = await supabase
    .from('a2a_agents')
    .select('*')
    .eq('type', 'analytics')
    .order('agent_id');
  
  if (error) {
    console.error('❌ Failed to fetch agents:', error);
    return;
  }
  
  console.log(`\n📊 Found ${agents.length} analytics agents to register`);
  
  const results = {
    successful: 0,
    failed: 0,
    compliant: 0,
    nonCompliant: 0
  };
  
  // Process each agent
  for (const agent of agents) {
    console.log('\n' + '='.repeat(60));
    console.log(`Processing: ${agent.name}`);
    
    // Enhance with AI
    const enhanced = await enhanceAgentWithAI(agent);
    
    // Validate compliance
    const compliance = validateCompliance(agent, enhanced);
    if (compliance.isCompliant) {
      console.log('✅ Agent is compliant');
      results.compliant++;
    } else {
      console.log('⚠️  Compliance issues:', compliance.issues);
      results.nonCompliant++;
    }
    
    // Register through A2A registry
    const registration = await registerAgent(agent, enhanced);
    
    if (registration.success) {
      results.successful++;
      
      // Onboard to blockchain
      await onboardAgent(agent.agent_id);
    } else {
      results.failed++;
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Registration Summary:');
  console.log(`  ✅ Successful: ${results.successful}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  ✅ Compliant: ${results.compliant}`);
  console.log(`  ⚠️  Non-compliant: ${results.nonCompliant}`);
  console.log('\n✨ AI-Assisted Registration Process Complete');
}

// Run the registration process
runAIAssistedRegistration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });