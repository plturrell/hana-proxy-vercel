/**
 * Local test for Curriculum Learning Agent
 */

import dotenv from 'dotenv';
import { CurriculumLearningAgent } from './agents/curriculum-learning-agent.js';

dotenv.config({ path: '.env.local' });

async function testAgent() {
  console.log('Testing Curriculum Learning Agent locally...');
  
  try {
    const agentData = {
      agent_id: 'finsight.education.curriculum_learning',
      agent_name: 'Curriculum Learning Agent',
      agent_type: 'education',
      voting_power: 150,
      connection_config: {
        goals: [
          'Enforce CFA standards across all financial calculations',
          'Maintain treasury best practices',
          'Provide business context to technical agents',
          'Prevent financial methodology errors'
        ],
        personality: 'authoritative'
      }
    };
    
    console.log('Creating agent instance...');
    const agent = new CurriculumLearningAgent(agentData);
    
    console.log('Agent created successfully!');
    console.log('Agent ID:', agent.id);
    console.log('Agent Name:', agent.name);
    console.log('Capabilities:', agent.capabilities);
    console.log('Knowledge Domains:', Object.keys(agent.knowledgeDomains));
    
    // Test validation
    console.log('\nTesting validation...');
    const testOutput = {
      weights: { 'AAPL': 0.3, 'MSFT': 0.4, 'GOOGL': 0.3 },
      expected_return: 0.12,
      risk: 0.18
    };
    
    const testContext = {
      calculation_type: 'portfolio_optimization',
      treasury_function: 'investment_selection'
    };
    
    const validation = await agent.validateAgentOutput('test.agent', testOutput, testContext);
    console.log('Validation result:', validation);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

testAgent();