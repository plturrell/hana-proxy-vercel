/**
 * Test Structured Outputs with X.AI Grok
 * Demonstrates the benefits of using structured outputs
 */

import dotenv from 'dotenv';
import { 
  AGENT_DECISION_SCHEMA, 
  MARKET_ANALYSIS_SCHEMA,
  COMPLIANCE_ANALYSIS_SCHEMA,
  callGrokStructured 
} from './lib/grok-structured-schemas.js';

dotenv.config();

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

async function testAgentDecision() {
  console.log('\n🤖 Testing Agent Decision with Structured Output...');
  
  const messages = [
    {
      role: 'system',
      content: 'You are an autonomous financial agent making decisions about market opportunities.'
    },
    {
      role: 'user',
      content: `A new market opportunity has been detected:
      - Symbol: NVDA
      - Current Price: $890
      - Volume Spike: 150% above average
      - News: Positive AI chip announcement
      - Technical Indicators: RSI 68, MACD bullish crossover
      
      Should you respond to this opportunity? What action should you take?`
    }
  ];
  
  try {
    const decision = await callGrokStructured(GROK_API_KEY, messages, AGENT_DECISION_SCHEMA);
    console.log('✅ Structured Decision:', JSON.stringify(decision, null, 2));
    console.log('\nType checking passed:', 
      typeof decision.shouldRespond === 'boolean',
      typeof decision.confidence === 'number',
      Array.isArray(decision.recipientIds)
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testMarketAnalysis() {
  console.log('\n📊 Testing Market Analysis with Structured Output...');
  
  const messages = [
    {
      role: 'system',
      content: 'You are a market analysis AI providing comprehensive technical and fundamental analysis.'
    },
    {
      role: 'user',
      content: `Analyze TSLA with the following data:
      - Price: $240
      - 52-week range: $180-$280
      - RSI: 45
      - Volume: Average
      - Recent news: Mixed sentiment on production numbers
      - Sector performance: EV sector down 5% this week`
    }
  ];
  
  try {
    const analysis = await callGrokStructured(GROK_API_KEY, messages, MARKET_ANALYSIS_SCHEMA);
    console.log('✅ Structured Analysis:', JSON.stringify(analysis, null, 2));
    console.log('\nValidation passed:',
      ['very_bullish', 'bullish', 'neutral', 'bearish', 'very_bearish'].includes(analysis.analysis.sentiment),
      analysis.prediction.confidence >= 0 && analysis.prediction.confidence <= 1
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testComplianceAnalysis() {
  console.log('\n⚖️ Testing Compliance Analysis with Structured Output...');
  
  const messages = [
    {
      role: 'system',
      content: 'You are a compliance AI specializing in A2A and ORD standards for financial systems.'
    },
    {
      role: 'user',
      content: `Analyze this agent registration for compliance:
      {
        "agent_id": "agent-test-001",
        "name": "Test Agent",
        "type": "analytics",
        "capabilities": ["calculate"],
        "metadata": {}
      }
      
      Check for A2A/ORD compliance issues and provide fixes.`
    }
  ];
  
  try {
    const compliance = await callGrokStructured(GROK_API_KEY, messages, COMPLIANCE_ANALYSIS_SCHEMA);
    console.log('✅ Structured Compliance:', JSON.stringify(compliance, null, 2));
    console.log('\nAll fields validated:',
      Array.isArray(compliance.predictions),
      typeof compliance.riskScore === 'number',
      typeof compliance.readyForCreation === 'boolean'
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function compareWithTraditional() {
  console.log('\n🔄 Comparing Structured vs Traditional Approach...');
  
  const testPrompt = {
    role: 'user',
    content: 'Should we buy AAPL at $195? Respond with JSON including decision and confidence.'
  };
  
  // Traditional approach
  console.log('\n1️⃣ Traditional Approach (prone to errors):');
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        messages: [testPrompt],
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    console.log('Raw response:', content);
    
    // This could fail!
    const parsed = JSON.parse(content);
    console.log('Parsed (may fail):', parsed);
  } catch (error) {
    console.error('❌ Traditional approach failed:', error.message);
  }
  
  // Structured approach
  console.log('\n2️⃣ Structured Approach (guaranteed to work):');
  const structuredSchema = {
    name: "buy_decision",
    schema: {
      type: "object",
      properties: {
        decision: { type: "string", enum: ["buy", "sell", "hold"] },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reasoning: { type: "string" }
      },
      required: ["decision", "confidence", "reasoning"]
    }
  };
  
  const result = await callGrokStructured(GROK_API_KEY, [testPrompt], structuredSchema);
  console.log('✅ Guaranteed structured result:', result);
}

// Run all tests
async function runAllTests() {
  console.log('🚀 X.AI Structured Output Test Suite');
  console.log('====================================');
  
  if (!GROK_API_KEY) {
    console.error('❌ Please set GROK_API_KEY environment variable');
    process.exit(1);
  }
  
  await testAgentDecision();
  await testMarketAnalysis();
  await testComplianceAnalysis();
  await compareWithTraditional();
  
  console.log('\n✨ All tests completed!');
  console.log('\n📚 Benefits of Structured Outputs:');
  console.log('1. ✅ No JSON parsing errors');
  console.log('2. ✅ Guaranteed schema compliance');
  console.log('3. ✅ Type safety and validation');
  console.log('4. ✅ Consistent response format');
  console.log('5. ✅ Better error handling');
}

runAllTests().catch(console.error);