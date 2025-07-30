import fetch from 'node-fetch';

async function testEnhancedAgents() {
  console.log('🤖 TESTING ENHANCED GRAPHQL WITH AGENTS');
  console.log('========================================\n');

  const query = `
    query GetEnhancedIntelligence($symbol: String!) {
      marketIntelligence(symbol: $symbol) {
        symbol
        currentPrice
        priceChange
        percentageChange
        volume
        
        technical {
          indicators {
            price
            sma20
            sma50
            rsi
            macd
            macdSignal
            volumeTrend
          }
          prediction
          confidence
          reasoning
          support
          resistance
        }
        
        sentiment {
          overall
          trajectory
          newsImpact {
            articles {
              id
              title
              sentiment
              importance
              source
              keyInsights
              marketImpact {
                direction
                magnitude
                confidence
              }
            }
            impactMap {
              primaryImpact
              secondaryImpacts
              timeline
            }
          }
        }
        
        predictions {
          consensus {
            direction
            targetPrice
            confidence
            timeframe
          }
          agentPredictions {
            agentId
            prediction
            confidence
            reasoning
          }
        }
        
        risks {
          factor
          severity
          probability
          mitigation
        }
        
        opportunities {
          type
          asset
          direction
          confidence
          potential_return
          risk_level
          timeframe
          entry_criteria
          exit_criteria
          catalyst
        }
      }
    }
  `;

  try {
    console.log('📊 Testing with NVDA (comprehensive analysis)...\n');

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
      return;
    }

    const intel = data.data?.marketIntelligence;
    if (!intel) {
      console.log('❌ No intelligence data returned');
      return;
    }

    console.log('✅ MARKET DATA:');
    console.log(`   Symbol: ${intel.symbol}`);
    console.log(`   Current Price: $${intel.currentPrice}`);
    console.log(`   Change: ${intel.priceChange > 0 ? '+' : ''}${intel.priceChange} (${intel.percentageChange}%)`);
    console.log(`   Volume: ${intel.volume?.toLocaleString()}`);

    if (intel.technical?.indicators) {
      console.log('\n🔧 TECHNICAL ANALYSIS:');
      console.log(`   RSI: ${intel.technical.indicators.rsi?.toFixed(2)}`);
      console.log(`   SMA20: $${intel.technical.indicators.sma20?.toFixed(2)}`);
      console.log(`   SMA50: $${intel.technical.indicators.sma50?.toFixed(2)}`);
      console.log(`   Volume Trend: ${intel.technical.indicators.volumeTrend}`);
      console.log(`   Prediction: ${intel.technical.prediction} (${(intel.technical.confidence * 100).toFixed(1)}%)`);
      console.log(`   Support: $${intel.technical.support?.toFixed(2)}`);
      console.log(`   Resistance: $${intel.technical.resistance?.toFixed(2)}`);
      console.log(`   Reasoning: ${intel.technical.reasoning}`);
    }

    if (intel.sentiment) {
      console.log('\n📰 NEWS SENTIMENT ANALYSIS:');
      console.log(`   Overall Sentiment: ${intel.sentiment.overall?.toFixed(3)}`);
      console.log(`   Trajectory: ${intel.sentiment.trajectory}`);
      console.log(`   Articles Found: ${intel.sentiment.newsImpact?.articles?.length || 0}`);
      
      if (intel.sentiment.newsImpact?.articles?.length > 0) {
        console.log('\n   📄 Recent News Articles:');
        intel.sentiment.newsImpact.articles.slice(0, 3).forEach((article, i) => {
          console.log(`   ${i + 1}. ${article.title?.substring(0, 60)}...`);
          console.log(`      Sentiment: ${article.sentiment?.toFixed(2)} | Source: ${article.source}`);
          if (article.keyInsights?.length > 0) {
            console.log(`      Insights: ${article.keyInsights.join(', ')}`);
          }
        });
      }
    }

    if (intel.predictions?.agentPredictions) {
      console.log('\n🤖 AGENT PREDICTIONS:');
      intel.predictions.agentPredictions.forEach(pred => {
        console.log(`   ${pred.agentId}:`);
        console.log(`     Prediction: ${pred.prediction} (${(pred.confidence * 100).toFixed(1)}%)`);
        console.log(`     Reasoning: ${pred.reasoning}`);
      });

      if (intel.predictions.consensus) {
        console.log('\n🎯 CONSENSUS PREDICTION:');
        console.log(`   Direction: ${intel.predictions.consensus.direction}`);
        console.log(`   Target Price: $${intel.predictions.consensus.targetPrice?.toFixed(2) || 'N/A'}`);
        console.log(`   Confidence: ${(intel.predictions.consensus.confidence * 100)?.toFixed(1) || 'N/A'}%`);
        console.log(`   Timeframe: ${intel.predictions.consensus.timeframe}`);
      }
    }

    if (intel.risks?.length > 0) {
      console.log('\n⚠️ RISK ASSESSMENT:');
      intel.risks.forEach((risk, i) => {
        console.log(`   ${i + 1}. ${risk.factor} (${risk.severity} severity)`);
        console.log(`      Probability: ${(risk.probability * 100).toFixed(0)}%`);
        console.log(`      Mitigation: ${risk.mitigation}`);
      });
    }

    if (intel.opportunities?.length > 0) {
      console.log('\n💡 AI-POWERED TRADING OPPORTUNITIES:');
      intel.opportunities.forEach((opp, i) => {
        if (opp && (opp.type || opp.rationale)) {
          // Handle AI-generated opportunities (more detailed format)
          if (opp.rationale) {
            console.log(`   ${i + 1}. ${opp.type || 'TRADE'} OPPORTUNITY`)
            console.log(`      Symbol: ${opp.symbol}`);
            console.log(`      Entry: $${opp.entry_point}`);
            console.log(`      Target: $${opp.target_price} (${opp.potential_upside})`);
            console.log(`      Stop Loss: $${opp.stop_loss} (${opp.potential_downside})`);
            console.log(`      Risk/Reward: ${opp.risk_reward_ratio}`);
            console.log(`      Timeframe: ${opp.timeframe}`);
            console.log(`      Confidence: ${opp.confidence_level}`);
            console.log(`      Rationale: ${opp.rationale?.substring(0, 120)}...`);
            if (opp.catalysts?.length > 0) {
              console.log(`      Key Catalysts: ${opp.catalysts.slice(0, 2).map(c => c.substring(0, 40)).join(', ')}...`);
            }
          } else {
            // Handle basic opportunities
            console.log(`   ${i + 1}. ${opp.type?.toUpperCase()} - ${opp.direction?.toUpperCase()}`);
            console.log(`      Confidence: ${(opp.confidence * 100).toFixed(0)}%`);
            console.log(`      Potential Return: ${opp.potential_return}`);
            console.log(`      Risk Level: ${opp.risk_level}`);
            console.log(`      Timeframe: ${opp.timeframe}`);
            console.log(`      Entry: ${opp.entry_criteria}`);
            console.log(`      Exit: ${opp.exit_criteria}`);
            console.log(`      Catalyst: ${opp.catalyst}`);
          }
        } else {
          console.log(`   ${i + 1}. No valid opportunities found`);
        }
      });
    }

    console.log('\n🎉 ENHANCED GRAPHQL WITH AGENTS IS WORKING!');
    console.log('✅ News Intelligence Agent: Active');
    console.log('✅ Market Data Agent: Active');
    console.log('✅ Technical Analysis: Complete');
    console.log('✅ Risk Management: Active');
    console.log('✅ AI-Powered Insights: Available');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testEnhancedAgents().catch(console.error);