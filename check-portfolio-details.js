import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPortfolioDetails() {
  console.log('=== Portfolio Details ===\n');
  
  // 1. Check portfolios table
  console.log('1. Portfolios:');
  const { data: portfolios, error: portfoliosError } = await supabase
    .from('portfolios')
    .select('*')
    .limit(5);
  
  if (!portfoliosError) {
    console.log(`Found ${portfolios.length} portfolios:`);
    portfolios.forEach(p => {
      console.log(`- ${p.portfolio_id}: ${p.portfolio_name} (${p.base_currency})`);
    });
  }
  
  // 2. Check sample positions
  console.log('\n2. Sample Portfolio Positions:');
  const { data: positions, error: positionsError } = await supabase
    .from('portfolio_positions')
    .select('*')
    .eq('portfolio_id', 'INST_BANK_001')
    .limit(10);
  
  if (!positionsError && positions) {
    console.log(`\nShowing 10 positions from INST_BANK_001:`);
    console.log('Symbol | Quantity | Market Value | Unrealized PnL');
    console.log('-'.repeat(50));
    positions.forEach(p => {
      console.log(`${p.symbol.padEnd(10)} | ${p.quantity.toString().padEnd(8)} | $${p.market_value?.toFixed(2).padStart(12)} | $${p.unrealized_pnl?.toFixed(2).padStart(12)}`);
    });
  }
  
  // 3. Get unique symbols to understand what assets are in the portfolio
  console.log('\n3. Asset Types in Portfolio:');
  const { data: assetTypes } = await supabase
    .from('portfolio_positions')
    .select('symbol')
    .eq('portfolio_id', 'INST_BANK_001')
    .limit(50);
  
  if (assetTypes) {
    const uniqueTypes = new Set();
    assetTypes.forEach(a => {
      if (a.symbol.includes('-')) {
        const type = a.symbol.split('-')[0];
        uniqueTypes.add(type);
      } else {
        uniqueTypes.add('EQUITY');
      }
    });
    console.log('Asset types found:', Array.from(uniqueTypes));
  }
  
  // 4. Check if we have any user-specific portfolios
  console.log('\n4. User Portfolios:');
  const { data: userPortfolios, count } = await supabase
    .from('user_portfolios')
    .select('*', { count: 'exact' });
  
  console.log(`User portfolios table has ${count || 0} records`);
  
  // 5. Create a test portfolio for our news impact analysis
  console.log('\n5. Creating test portfolio for news impact analysis...');
  
  // Check if test portfolio exists
  const { data: existing, error: checkError } = await supabase
    .from('portfolios')
    .select('*')
    .eq('portfolio_id', 'TEST_NEWS_IMPACT')
    .single();
  
  if (!existing) {
    const { data: newPortfolio, error: createError } = await supabase
      .from('portfolios')
      .insert({
        portfolio_id: 'TEST_NEWS_IMPACT',
        user_id: 'test_user_news',
        portfolio_name: 'Test Portfolio for News Impact Analysis',
        portfolio_type: 'test',
        base_currency: 'USD',
        total_value: 1000000
      })
      .select()
      .single();
    
    if (!createError) {
      console.log('✅ Created test portfolio:', newPortfolio.portfolio_id);
      
      // Add some tech stock positions for testing news impact
      const testPositions = [
        { symbol: 'AAPL', quantity: 100, market_value: 18250 },
        { symbol: 'MSFT', quantity: 50, market_value: 21250 },
        { symbol: 'GOOGL', quantity: 25, market_value: 3875 },
        { symbol: 'NVDA', quantity: 30, market_value: 26700 },
        { symbol: 'TSLA', quantity: 40, market_value: 9800 },
        { symbol: 'META', quantity: 35, market_value: 12250 },
        { symbol: 'AMZN', quantity: 60, market_value: 10200 }
      ];
      
      const positionInserts = testPositions.map(pos => ({
        portfolio_id: 'TEST_NEWS_IMPACT',
        asset_id: `ASSET_${pos.symbol}`,
        symbol: pos.symbol,
        quantity: pos.quantity,
        market_value: pos.market_value,
        unrealized_pnl: Math.random() * 2000 - 1000
      }));
      
      const { error: insertError } = await supabase
        .from('portfolio_positions')
        .insert(positionInserts);
      
      if (!insertError) {
        console.log('✅ Added test positions for:', testPositions.map(p => p.symbol).join(', '));
      } else {
        console.log('❌ Error adding positions:', insertError.message);
      }
    } else {
      console.log('❌ Error creating portfolio:', createError.message);
    }
  } else {
    console.log('✅ Test portfolio already exists:', existing.portfolio_id);
  }
}

checkPortfolioDetails().catch(console.error);