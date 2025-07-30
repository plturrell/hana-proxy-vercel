import fetch from 'node-fetch';

async function testDeployedAI() {
  console.log('🚀 Testing Deployed GraphQL with AI');
  console.log('===================================\n');

  const query = `
    query GetMarketIntelligence($symbol: String!) {
      marketIntelligence(symbol: $symbol) {
        symbol
        currentPrice
        sentiment {
          overall
          trajectory
        }
        predictions {
          agentPredictions
          consensus {
            direction
            confidence
          }
        }
        opportunities
        risks {
          factor
          severity
          mitigation
        }
      }
    }
  `;

  try {
    const response = await fetch('https://hana-proxy-vercel.vercel.app/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        variables: { symbol: 'NVDA' }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.log('❌ GraphQL Errors:', data.errors);
    } else if (data.data?.marketIntelligence) {
      const intel = data.data.marketIntelligence;
      
      console.log('✅ Market Intelligence for', intel.symbol);
      console.log('📊 Current Price: $' + intel.currentPrice);
      console.log('📈 Sentiment:', intel.sentiment?.overall, '(' + intel.sentiment?.trajectory + ')');
      
      if (intel.predictions?.agentPredictions) {
        console.log('\n🤖 AI Agent Predictions:');
        console.log(JSON.stringify(intel.predictions.agentPredictions, null, 2));
        console.log('\n✨ AI FEATURES ARE ACTIVE! ✨');
      } else {
        console.log('\n⚠️ AI predictions not available - check GROK_API_KEY in Vercel');
      }
      
      if (intel.opportunities && intel.opportunities.length > 0) {
        console.log('\n💡 Opportunities Identified:');
        intel.opportunities.forEach((opp, i) => {
          console.log(`${i + 1}. ${opp.type} - ${opp.direction} (confidence: ${opp.confidence})`);
        });
      }
      
      if (intel.risks && intel.risks.length > 0) {
        console.log('\n⚠️ Risks Identified:');
        intel.risks.forEach(risk => {
          console.log(`- ${risk.factor} (${risk.severity}): ${risk.mitigation}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testDeployedAI().catch(console.error);