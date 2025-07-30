/**
 * Direct test of portfolio impact functions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPortfolioFunctions() {
  console.log('🧪 Testing Portfolio Impact Functions\n');
  
  // 1. Test getting portfolio positions
  console.log('1️⃣ Getting portfolio positions for TEST_NEWS_IMPACT...');
  
  const { data: positions, error } = await supabase
    .from('portfolio_positions')
    .select('*')
    .eq('portfolio_id', 'TEST_NEWS_IMPACT');
  
  if (error) {
    console.error('❌ Error getting positions:', error);
    return;
  }
  
  console.log(`✅ Found ${positions.length} positions:`);
  positions.forEach(p => {
    console.log(`   ${p.symbol}: ${p.quantity} shares @ $${(p.market_value / p.quantity).toFixed(2)} = $${p.market_value.toFixed(2)}`);
  });
  
  const totalValue = positions.reduce((sum, p) => sum + p.market_value, 0);
  console.log(`   Total Portfolio Value: $${totalValue.toFixed(2)}\n`);
  
  // 2. Test impact calculation
  console.log('2️⃣ Simulating news impact on AAPL...');
  
  const applePosition = positions.find(p => p.symbol === 'AAPL');
  if (applePosition) {
    const impactScenarios = [
      { news: 'Earnings beat by 15%', impact: 0.05 },
      { news: 'Product recall announced', impact: -0.08 },
      { news: 'New iPhone launch', impact: 0.03 }
    ];
    
    console.log('Impact scenarios:');
    impactScenarios.forEach(scenario => {
      const dollarImpact = applePosition.market_value * scenario.impact;
      console.log(`   ${scenario.news}: ${scenario.impact > 0 ? '+' : ''}${(scenario.impact * 100).toFixed(1)}% = ${dollarImpact > 0 ? '+' : ''}$${dollarImpact.toFixed(2)}`);
    });
  }
  
  // 3. Test sector exposure
  console.log('\n3️⃣ Calculating tech sector exposure...');
  
  const techSymbols = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'AMZN'];
  const techPositions = positions.filter(p => techSymbols.includes(p.symbol));
  const techValue = techPositions.reduce((sum, p) => sum + p.market_value, 0);
  const techPercentage = (techValue / totalValue * 100).toFixed(1);
  
  console.log(`   Tech positions: ${techPositions.length}`);
  console.log(`   Tech sector value: $${techValue.toFixed(2)}`);
  console.log(`   Tech sector exposure: ${techPercentage}%`);
  
  // 4. Test correlation impact
  console.log('\n4️⃣ Simulating correlated impact from NVDA news...');
  
  const correlations = {
    'NVDA': { 'NVDA': 1.0, 'AMD': 0.85, 'MSFT': 0.65, 'GOOGL': 0.60, 'AAPL': 0.55 },
  };
  
  const nvdaImpact = 0.10; // 10% positive news impact
  console.log(`   NVDA news impact: +${(nvdaImpact * 100).toFixed(0)}%`);
  console.log('   Correlated impacts:');
  
  positions.forEach(p => {
    const correlation = correlations['NVDA'][p.symbol] || 0;
    if (correlation > 0) {
      const correlatedImpact = nvdaImpact * correlation;
      const dollarImpact = p.market_value * correlatedImpact;
      console.log(`   ${p.symbol}: ${(correlation * 100).toFixed(0)}% correlation = +${(correlatedImpact * 100).toFixed(1)}% = +$${dollarImpact.toFixed(2)}`);
    }
  });
  
  // 5. Test with real Grok API if available
  console.log('\n5️⃣ Testing Grok API integration...');
  
  const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (!GROK_API_KEY || GROK_API_KEY.includes('placeholder')) {
    console.log('❌ No valid Grok API key found');
    console.log('   Set GROK_API_KEY or XAI_API_KEY to enable AI analysis');
  } else {
    console.log('✅ Grok API key configured');
    console.log('   Ready for AI-powered portfolio impact analysis');
    
    // Test simple Grok call
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
              role: 'user',
              content: 'Respond with just "OK" if you can help analyze portfolio impact.'
            }
          ],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        console.log('✅ Grok API connection successful');
      } else {
        console.log('❌ Grok API error:', response.status);
      }
    } catch (error) {
      console.log('❌ Grok API connection failed:', error.message);
    }
  }
  
  console.log('\n✅ All tests completed!');
  console.log('\nPortfolio ready for news impact analysis:');
  console.log('- Portfolio ID: TEST_NEWS_IMPACT');
  console.log('- Total positions: ' + positions.length);
  console.log('- Total value: $' + totalValue.toFixed(2));
}

testPortfolioFunctions().catch(console.error);