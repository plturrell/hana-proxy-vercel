/**
 * Test Grok Portfolio Impact with Real News
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

async function testGrokNewsImpact() {
  console.log('🧪 Testing Grok News → Portfolio Impact Analysis\n');
  
  // Real news scenario
  const newsScenario = {
    title: "NVIDIA Surges 5% After Announcing Revolutionary AI Chip, Microsoft and Google Place $20B Orders",
    summary: "NVIDIA unveiled its next-generation Blackwell AI chip architecture today, with Microsoft and Google immediately committing to $20 billion in orders. The new chips offer 10x performance improvement over current generation. AMD shares fell 3% on competitive concerns.",
    source: "Reuters",
    category: "breaking_news",
    entities: ["NVDA", "MSFT", "GOOGL", "AMD", "AI", "Semiconductors"],
    published_at: new Date().toISOString()
  };
  
  console.log('📰 News:', newsScenario.title);
  console.log('📝 Summary:', newsScenario.summary);
  console.log('🏢 Entities:', newsScenario.entities.join(', '));
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Call Grok with function calling
  console.log('🤖 Calling Grok with function calling enabled...\n');
  
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        messages: [
          {
            role: 'system',
            content: `You are a portfolio impact analyst. Analyze how this news affects the TEST_NEWS_IMPACT portfolio which contains:
            AAPL (100 shares @ $182.50), MSFT (50 @ $425), GOOGL (25 @ $155), NVDA (30 @ $890), 
            TSLA (40 @ $245), META (35 @ $350), AMZN (60 @ $170).
            
            Provide specific impact percentages for each affected position and calculate dollar impacts.`
          },
          {
            role: 'user',
            content: `Analyze the portfolio impact of this news:

${JSON.stringify(newsScenario, null, 2)}

Please provide:
1. Which positions are directly affected
2. Which positions are indirectly affected (via correlation/sector)
3. Estimated impact percentage for each position
4. Total dollar impact on portfolio
5. Confidence level in your assessment
6. Specific recommendations

Format your response as JSON with this structure:
{
  "directly_affected": [
    {"symbol": "XXX", "impact_percent": X.X, "reason": "..."}
  ],
  "indirectly_affected": [
    {"symbol": "XXX", "impact_percent": X.X, "correlation": X.X, "reason": "..."}
  ],
  "portfolio_impact": {
    "total_dollar_impact": XXXX,
    "total_percent_impact": X.X,
    "confidence": X.X
  },
  "recommendations": [
    "specific action 1",
    "specific action 2"
  ],
  "risk_factors": ["risk 1", "risk 2"]
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Grok API error:', response.status, error);
      return;
    }
    
    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    console.log('✅ Grok Analysis Complete!\n');
    
    // Display results
    console.log('📊 DIRECTLY AFFECTED POSITIONS:');
    analysis.directly_affected.forEach(pos => {
      const position = getPosition(pos.symbol);
      const dollarImpact = position.value * (pos.impact_percent / 100);
      console.log(`   ${pos.symbol}: ${pos.impact_percent > 0 ? '+' : ''}${pos.impact_percent}% = ${dollarImpact > 0 ? '+' : ''}$${Math.abs(dollarImpact).toFixed(2)}`);
      console.log(`   Reason: ${pos.reason}`);
    });
    
    console.log('\n📈 INDIRECTLY AFFECTED POSITIONS:');
    analysis.indirectly_affected.forEach(pos => {
      const position = getPosition(pos.symbol);
      const dollarImpact = position.value * (pos.impact_percent / 100);
      console.log(`   ${pos.symbol}: ${pos.impact_percent > 0 ? '+' : ''}${pos.impact_percent}% = ${dollarImpact > 0 ? '+' : ''}$${Math.abs(dollarImpact).toFixed(2)}`);
      console.log(`   Correlation: ${(pos.correlation * 100).toFixed(0)}% | Reason: ${pos.reason}`);
    });
    
    console.log('\n💰 PORTFOLIO IMPACT SUMMARY:');
    console.log(`   Total Dollar Impact: ${analysis.portfolio_impact.total_dollar_impact > 0 ? '+' : ''}$${Math.abs(analysis.portfolio_impact.total_dollar_impact).toFixed(2)}`);
    console.log(`   Total Percent Impact: ${analysis.portfolio_impact.total_percent_impact > 0 ? '+' : ''}${analysis.portfolio_impact.total_percent_impact}%`);
    console.log(`   Confidence Level: ${(analysis.portfolio_impact.confidence * 100).toFixed(0)}%`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    analysis.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    
    if (analysis.risk_factors && analysis.risk_factors.length > 0) {
      console.log('\n⚠️  RISK FACTORS:');
      analysis.risk_factors.forEach((risk, i) => {
        console.log(`   ${i + 1}. ${risk}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Helper function to get position data
function getPosition(symbol) {
  const positions = {
    'AAPL': { quantity: 100, price: 182.50, value: 18250 },
    'MSFT': { quantity: 50, price: 425.00, value: 21250 },
    'GOOGL': { quantity: 25, price: 155.00, value: 3875 },
    'NVDA': { quantity: 30, price: 890.00, value: 26700 },
    'TSLA': { quantity: 40, price: 245.00, value: 9800 },
    'META': { quantity: 35, price: 350.00, value: 12250 },
    'AMZN': { quantity: 60, price: 170.00, value: 10200 }
  };
  return positions[symbol] || { quantity: 0, price: 0, value: 0 };
}

testGrokNewsImpact().catch(console.error);