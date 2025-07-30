/**
 * Test Grok Portfolio Impact Analysis
 * Tests the news → portfolio impact pipeline with real function calling
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/grok-portfolio-impact';

// Test news scenarios
const testScenarios = [
  {
    name: "Apple Earnings Beat",
    news_data: {
      title: "Apple Reports Record Q4 Earnings, Beats Expectations by 15%",
      summary: "Apple Inc. (AAPL) reported record-breaking Q4 earnings with revenue up 15% YoY. iPhone sales exceeded analyst expectations. The company also announced a $90 billion stock buyback program.",
      source: "Reuters",
      category: "earnings",
      entities: ["AAPL", "Apple Inc.", "Technology"],
      sentiment: 0.8,
      published_at: new Date().toISOString()
    }
  },
  {
    name: "Tech Sector Selloff",
    news_data: {
      title: "Tech Stocks Plunge Amid Rising Interest Rate Fears",
      summary: "Major technology stocks including Microsoft, Google, and NVIDIA fell sharply today as Federal Reserve officials signaled more aggressive rate hikes. The NASDAQ dropped 3.5% in early trading.",
      source: "Bloomberg",
      category: "market_movement",
      entities: ["MSFT", "GOOGL", "NVDA", "Technology Sector", "NASDAQ"],
      sentiment: -0.7,
      published_at: new Date().toISOString()
    }
  },
  {
    name: "EV Market Competition",
    news_data: {
      title: "Tesla Faces Increased Competition as Legacy Automakers Accelerate EV Plans",
      summary: "Tesla's market share in EVs dropped to 45% as Ford, GM, and international competitors launched new electric models. Analysts warn of margin pressure for Tesla in coming quarters.",
      source: "WSJ",
      category: "industry_analysis",
      entities: ["TSLA", "Tesla Inc.", "Electric Vehicles", "Automotive"],
      sentiment: -0.4,
      published_at: new Date().toISOString()
    }
  },
  {
    name: "AI Chip Demand Surge",
    news_data: {
      title: "NVIDIA Announces New AI Chip Orders Worth $15 Billion from Major Cloud Providers",
      summary: "NVIDIA secured massive orders for its next-generation AI chips from Amazon, Microsoft, and Google. The company raised guidance for next quarter by 25%.",
      source: "CNBC",
      category: "corporate_news",
      entities: ["NVDA", "AMZN", "MSFT", "GOOGL", "AI", "Semiconductors"],
      sentiment: 0.9,
      published_at: new Date().toISOString()
    }
  }
];

async function testPortfolioImpact() {
  console.log('🧪 Testing Grok Portfolio Impact Analysis\n');
  console.log('Using portfolio: TEST_NEWS_IMPACT\n');
  console.log('='.repeat(60) + '\n');

  for (const scenario of testScenarios) {
    console.log(`📰 Scenario: ${scenario.name}`);
    console.log(`News: ${scenario.news_data.title}\n`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          news_data: scenario.news_data,
          portfolio_id: 'TEST_NEWS_IMPACT'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`❌ API Error (${response.status}):`, error);
        continue;
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Analysis Complete!\n');
        
        // Show affected positions
        if (result.affected_positions && result.affected_positions.length > 0) {
          console.log('📊 Affected Positions:');
          result.affected_positions.forEach(pos => {
            console.log(`   ${pos.symbol}: ${pos.impact_percentage > 0 ? '+' : ''}${pos.impact_percentage}% impact ($${pos.impact_dollars})`);
          });
        }
        
        // Show total impact
        console.log(`\n💰 Total Portfolio Impact: ${result.total_dollar_impact > 0 ? '+' : ''}$${Math.abs(result.total_dollar_impact).toFixed(2)}`);
        console.log(`📈 Confidence Score: ${(result.confidence_score * 100).toFixed(0)}%`);
        
        // Show recommendations
        if (result.recommendations && result.recommendations.length > 0) {
          console.log('\n💡 Recommendations:');
          result.recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
          });
        }
        
        // Show function calls made
        if (result.function_calls && result.function_calls.length > 0) {
          console.log(`\n🔧 Functions Called: ${result.function_calls.map(fc => fc.function).join(', ')}`);
        }
      } else {
        console.log('❌ Analysis failed:', result.error);
      }
      
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
    
    console.log('\n' + '-'.repeat(60) + '\n');
  }
  
  console.log('✅ All tests completed!');
}

// Direct test without API (for debugging)
async function testDirectFunctionCalling() {
  console.log('\n🔧 Testing Direct Function Calling\n');
  
  // Import the function implementations
  const module = await import('./api/grok-portfolio-impact.js');
  
  // Test getting portfolio positions
  console.log('1. Testing getPortfolioPositions:');
  const positions = await module.getPortfolioPositions({
    portfolio_id: 'TEST_NEWS_IMPACT'
  });
  console.log(`   Found ${positions.positions?.length || 0} positions`);
  console.log(`   Total value: $${positions.total_value?.toFixed(2) || 0}`);
  
  // Test exposure calculation
  console.log('\n2. Testing calculatePositionExposure:');
  if (positions.positions?.length > 0) {
    const exposure = await module.calculatePositionExposure({
      positions: positions.positions,
      affected_entities: ['AAPL', 'Technology', 'MSFT']
    });
    console.log(`   High exposure positions: ${exposure.high_exposure_positions?.length || 0}`);
    console.log(`   Total exposed value: $${exposure.total_exposed_value?.toFixed(2) || 0}`);
  }
}

// Run tests
const args = process.argv.slice(2);
if (args.includes('--direct')) {
  testDirectFunctionCalling().catch(console.error);
} else {
  testPortfolioImpact().catch(console.error);
}