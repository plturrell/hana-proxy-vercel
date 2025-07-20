import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Initialize Supabase with service role key
const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

// Popular symbols to populate
const SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 
  'TSLA', 'NVDA', 'JPM', 'V', 'JNJ',
  'WMT', 'PG', 'UNH', 'HD', 'MA',
  'DIS', 'BAC', 'ADBE', 'CRM', 'NFLX'
];

async function fetchMarketData(symbol) {
  try {
    // Try Alpha Vantage API (free tier)
    const API_KEY = 'demo'; // Use 'demo' for testing or get free key from alphavantage.co
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        volume: parseInt(quote['06. volume']),
        change_amount: parseFloat(quote['09. change']),
        change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
        timestamp: new Date(quote['07. latest trading day'] + 'T16:00:00-05:00'),
        source: 'alphavantage'
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return null;
  }
}

async function generateSampleData(symbol) {
  // Generate realistic sample data for testing
  const basePrice = {
    'AAPL': 195.89,
    'MSFT': 429.68,
    'GOOGL': 155.92,
    'AMZN': 178.35,
    'META': 503.76,
    'TSLA': 251.05,
    'NVDA': 875.28,
    'JPM': 199.75,
    'V': 276.43,
    'JNJ': 156.74
  }[symbol] || 100 + Math.random() * 400;

  const volatility = 0.02; // 2% daily volatility
  const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
  const price = basePrice + change;

  return {
    symbol,
    price: parseFloat(price.toFixed(2)),
    volume: Math.floor(10000000 + Math.random() * 50000000),
    change_amount: parseFloat(change.toFixed(2)),
    change_percent: parseFloat(((change / basePrice) * 100).toFixed(2)),
    timestamp: new Date(),
    source: 'simulated',
    data_type: 'quote',
    metadata: {
      market_cap: Math.floor(price * (1000000000 + Math.random() * 4000000000)),
      pe_ratio: 15 + Math.random() * 25,
      week_52_high: price * (1.1 + Math.random() * 0.3),
      week_52_low: price * (0.6 + Math.random() * 0.2)
    }
  };
}

async function populateMarketData() {
  console.log('🚀 POPULATING MARKET DATA');
  console.log('========================\n');

  let successCount = 0;
  let errorCount = 0;

  for (const symbol of SYMBOLS) {
    console.log(`📊 Processing ${symbol}...`);
    
    // Try to fetch real data first
    let marketData = await fetchMarketData(symbol);
    
    // If real data fails, generate sample data
    if (!marketData) {
      console.log(`  ⚠️ Using simulated data for ${symbol}`);
      marketData = await generateSampleData(symbol);
    }

    // Insert into database
    try {
      const { data, error } = await supabase
        .from('market_data')
        .insert([marketData]);

      if (error) {
        console.log(`  ❌ Error inserting ${symbol}:`, error.message);
        errorCount++;
      } else {
        console.log(`  ✅ Successfully inserted ${symbol} at $${marketData.price}`);
        successCount++;
      }
    } catch (e) {
      console.log(`  ❌ Exception for ${symbol}:`, e.message);
      errorCount++;
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📈 POPULATION COMPLETE');
  console.log('=====================');
  console.log(`✅ Success: ${successCount} symbols`);
  console.log(`❌ Errors: ${errorCount} symbols`);

  // Verify data was inserted
  console.log('\n🔍 Verifying data...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('market_data')
    .select('symbol, price, source')
    .order('timestamp', { ascending: false })
    .limit(10);

  if (!verifyError && verifyData) {
    console.log('\nLatest market data:');
    verifyData.forEach(d => {
      console.log(`  ${d.symbol}: $${d.price} (${d.source})`);
    });
  }
}

// Also create a market data agent that continuously updates
async function startMarketDataAgent() {
  console.log('\n🤖 STARTING MARKET DATA AGENT');
  console.log('============================\n');

  const updateInterval = 60000; // Update every minute

  async function updateMarketData() {
    console.log(`[${new Date().toISOString()}] Updating market data...`);
    
    for (const symbol of SYMBOLS.slice(0, 5)) { // Update top 5 symbols more frequently
      const marketData = await generateSampleData(symbol);
      
      try {
        const { error } = await supabase
          .from('market_data')
          .insert([marketData]);

        if (!error) {
          console.log(`  ✅ Updated ${symbol}: $${marketData.price}`);
        }
      } catch (e) {
        console.log(`  ❌ Error updating ${symbol}:`, e.message);
      }
    }
  }

  // Initial update
  await updateMarketData();

  // Set up continuous updates
  console.log(`\n⏰ Market data agent will update every ${updateInterval/1000} seconds`);
  console.log('Press Ctrl+C to stop\n');

  setInterval(updateMarketData, updateInterval);
}

// Run the population
populateMarketData()
  .then(() => {
    console.log('\n💡 To start continuous updates, run:');
    console.log('node populate-market-data.js --agent\n');
    
    // Check if agent mode requested
    if (process.argv.includes('--agent')) {
      startMarketDataAgent();
    } else {
      process.exit(0);
    }
  })
  .catch(console.error);