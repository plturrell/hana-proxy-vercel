import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestPortfolio() {
  console.log('Creating test portfolio for news impact analysis...\n');
  
  // First, check the schema of portfolios table
  const { data: samplePortfolio } = await supabase
    .from('portfolios')
    .select('*')
    .limit(1)
    .single();
  
  console.log('Portfolio schema:', Object.keys(samplePortfolio || {}));
  
  // Check if test portfolio already exists
  const { data: existing } = await supabase
    .from('portfolios')
    .select('*')
    .eq('portfolio_id', 'TEST_NEWS_IMPACT')
    .single();
  
  if (!existing) {
    // Create portfolio matching the existing schema
    const { data: newPortfolio, error: createError } = await supabase
      .from('portfolios')
      .insert({
        portfolio_id: 'TEST_NEWS_IMPACT',
        user_id: 'test_user_news',
        portfolio_name: 'Test Portfolio for News Impact Analysis',
        portfolio_type: 'test',
        base_currency: 'USD'
        // Don't include total_value if it doesn't exist in schema
      })
      .select()
      .single();
    
    if (!createError) {
      console.log('✅ Created test portfolio:', newPortfolio.portfolio_id);
    } else {
      console.log('❌ Error creating portfolio:', createError);
      return;
    }
  } else {
    console.log('✅ Test portfolio already exists:', existing.portfolio_id);
  }
  
  // Check if positions already exist
  const { data: existingPositions, count } = await supabase
    .from('portfolio_positions')
    .select('*', { count: 'exact' })
    .eq('portfolio_id', 'TEST_NEWS_IMPACT');
  
  if (count === 0) {
    // Add tech stock positions for testing news impact
    const testPositions = [
      { symbol: 'AAPL', quantity: 100, price: 182.50 },
      { symbol: 'MSFT', quantity: 50, price: 425.00 },
      { symbol: 'GOOGL', quantity: 25, price: 155.00 },
      { symbol: 'NVDA', quantity: 30, price: 890.00 },
      { symbol: 'TSLA', quantity: 40, price: 245.00 },
      { symbol: 'META', quantity: 35, price: 350.00 },
      { symbol: 'AMZN', quantity: 60, price: 170.00 }
    ];
    
    const positionInserts = testPositions.map(pos => ({
      portfolio_id: 'TEST_NEWS_IMPACT',
      asset_id: `ASSET_${pos.symbol}_TEST`,
      symbol: pos.symbol,
      quantity: pos.quantity,
      market_value: pos.quantity * pos.price,
      unrealized_pnl: (Math.random() * 0.1 - 0.05) * pos.quantity * pos.price // ±5% random PnL
    }));
    
    const { error: insertError, data: insertedPositions } = await supabase
      .from('portfolio_positions')
      .insert(positionInserts)
      .select();
    
    if (!insertError) {
      console.log(`\n✅ Added ${insertedPositions.length} test positions:`);
      console.log('\nSymbol | Quantity | Market Value');
      console.log('-'.repeat(35));
      insertedPositions.forEach(p => {
        console.log(`${p.symbol.padEnd(6)} | ${p.quantity.toString().padEnd(8)} | $${p.market_value.toFixed(2)}`);
      });
      
      const totalValue = insertedPositions.reduce((sum, p) => sum + p.market_value, 0);
      console.log(`\nTotal Portfolio Value: $${totalValue.toFixed(2)}`);
    } else {
      console.log('❌ Error adding positions:', insertError);
    }
  } else {
    console.log(`\n✅ Portfolio already has ${count} positions`);
    console.log('\nExisting positions:');
    console.log('Symbol | Quantity | Market Value | Unrealized PnL');
    console.log('-'.repeat(50));
    existingPositions.slice(0, 10).forEach(p => {
      console.log(`${p.symbol.padEnd(6)} | ${p.quantity.toString().padEnd(8)} | $${p.market_value.toFixed(2).padStart(12)} | $${p.unrealized_pnl.toFixed(2).padStart(12)}`);
    });
  }
  
  console.log('\n✅ Test portfolio ready for news impact analysis!');
  console.log('Portfolio ID: TEST_NEWS_IMPACT');
  console.log('User ID: test_user_news');
}

createTestPortfolio().catch(console.error);