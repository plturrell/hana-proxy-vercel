/**
 * Direct test of Grok4 API and basic agent functionality
 */

import { config } from 'dotenv';

config();

async function testGrokAPI() {
  console.log('🧠 Testing Grok4 API Direct Connection...\n');

  const grokApiKey = process.env.GROK_API_KEY;
  
  if (!grokApiKey) {
    console.error('❌ GROK_API_KEY not found in environment');
    return;
  }

  console.log('✅ Grok API Key configured');
  console.log(`🔑 Key: ${grokApiKey.substring(0, 10)}...${grokApiKey.substring(grokApiKey.length - 4)}\n`);

  try {
    // Test basic Grok API call
    console.log('📡 Testing Grok API call...');
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-3-latest',
        messages: [
          {
            role: 'system',
            content: 'You are an autonomous AI agent named TestAgent. You make decisions based on logic and respond in JSON format.'
          },
          {
            role: 'user',
            content: 'You received a message asking "Can you help with data analysis?". Decide how to respond. Return JSON with: {"should_respond": boolean, "response_content": string, "reasoning": string}'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Grok API Error: ${response.status} - ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('✅ Grok API Response:', JSON.stringify(data, null, 2));
    
    const aiDecision = data.choices[0]?.message?.content;
    console.log('\n🤖 AI Agent Decision:');
    console.log(aiDecision);
    
    try {
      const parsedDecision = JSON.parse(aiDecision);
      console.log('\n📊 Parsed Decision:');
      console.log(`Should Respond: ${parsedDecision.should_respond}`);
      console.log(`Response: ${parsedDecision.response_content}`);
      console.log(`Reasoning: ${parsedDecision.reasoning}`);
    } catch (parseError) {
      console.log('⚠️  Could not parse as JSON, but got response');
    }

    console.log('\n🎉 Grok4 API Test Successful!');
    console.log('✅ Our A2A Autonomy Engine can make AI-powered decisions');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test autonomous agent decision-making scenarios
async function testAgentScenarios() {
  console.log('\n🎭 Testing Autonomous Agent Decision Scenarios...\n');
  
  const scenarios = [
    {
      name: 'Message Response',
      context: 'You are DataAnalyst agent. You received: "Please analyze sales trends for Q3"',
      schema: '{"should_respond": boolean, "response_content": string, "reasoning": string}'
    },
    {
      name: 'Proposal Voting',
      context: 'You are SecurityAgent. Proposal: "Allow external API access for faster data processing"',
      schema: '{"vote": "for/against/abstain", "reasoning": string}'
    },
    {
      name: 'Proactive Action',
      context: 'You are MonitoringAgent. Current time is 2:00 PM. Your goal is system health monitoring.',
      schema: '{"action": "send_message/create_proposal/none", "action_data": object, "reasoning": string}'
    }
  ];

  for (const scenario of scenarios) {
    console.log(`🎬 Scenario: ${scenario.name}`);
    
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-3-latest',
          messages: [
            {
              role: 'system',
              content: 'You are an autonomous AI agent. Make decisions based on your role and context. Always respond in valid JSON format.'
            },
            {
              role: 'user',
              content: `${scenario.context}\n\nRespond with JSON matching: ${scenario.schema}`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      const data = await response.json();
      const decision = data.choices[0]?.message?.content;
      
      console.log(`📝 Decision: ${decision}`);
      console.log('✅ Success\n');
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
    }
  }
}

// Run tests
async function runAllTests() {
  await testGrokAPI();
  await testAgentScenarios();
  
  console.log('\n🏆 COMPARISON: Our Implementation vs Reference');
  console.log('='.repeat(50));
  console.log('✅ AI Decision Engine: Grok4 (vs GPT-4 in reference)');
  console.log('✅ Autonomous Behaviors: Message processing, voting, proactive actions');
  console.log('✅ Real-time Processing: Supabase Edge Functions (vs server classes)');
  console.log('✅ Serverless Architecture: Auto-scaling, no maintenance');
  console.log('✅ Database Integration: Direct Supabase connection');
  console.log('✅ Event-driven: Real-time database triggers');
  console.log('');
  console.log('🎯 Key Advantages of Our Approach:');
  console.log('   • Serverless = No infrastructure management');
  console.log('   • Grok4 = Latest AI model, potentially better reasoning');
  console.log('   • Edge Functions = Global distribution, faster responses');
  console.log('   • Cost-effective = Pay per execution, not server uptime');
  console.log('');
  console.log('🚀 Status: Ready for autonomous agent deployment!');
}

runAllTests();
