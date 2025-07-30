import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deployTables() {
  console.log('📊 Creating market data tables in Supabase...\n');
  
  // First, let's check what tables already exist
  const { data: existingTables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['market_data', 'market_data_collection_log', 'market_symbols', 'market_alerts']);
  
  console.log('Existing tables:', existingTables?.map(t => t.table_name) || 'None found');
  
  // Create tables one by one
  const tables = [
    {
      name: 'market_data',
      create: `CREATE TABLE IF NOT EXISTS market_data (
        id BIGSERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        source VARCHAR(20) NOT NULL,
        price DECIMAL(20, 4) NOT NULL,
        change DECIMAL(20, 4),
        change_percent DECIMAL(10, 4),
        volume BIGINT,
        high DECIMAL(20, 4),
        low DECIMAL(20, 4),
        open DECIMAL(20, 4),
        previous_close DECIMAL(20, 4),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    },
    {
      name: 'market_data_collection_log',
      create: `CREATE TABLE IF NOT EXISTS market_data_collection_log (
        id BIGSERIAL PRIMARY KEY,
        source VARCHAR(50) NOT NULL,
        symbols_requested INTEGER,
        symbols_collected INTEGER,
        symbols_failed INTEGER,
        duplicates_skipped INTEGER,
        success_rate DECIMAL(5, 2),
        sources JSONB,
        error_details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    },
    {
      name: 'market_symbols',
      create: `CREATE TABLE IF NOT EXISTS market_symbols (
        symbol VARCHAR(20) PRIMARY KEY,
        name VARCHAR(255),
        exchange VARCHAR(50),
        category VARCHAR(50),
        sector VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`
    },
    {
      name: 'market_alerts',
      create: `CREATE TABLE IF NOT EXISTS market_alerts (
        id BIGSERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        message TEXT,
        current_value DECIMAL(20, 4),
        threshold_value DECIMAL(20, 4),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    }
  ];
  
  // Create each table
  for (const table of tables) {
    console.log(`\nCreating table: ${table.name}`);
    try {
      // Try inserting a test row to check if table exists
      const { error: testError } = await supabase
        .from(table.name)
        .select('id')
        .limit(1);
      
      if (testError && testError.code === '42P01') { // Table doesn't exist
        console.log(`Table ${table.name} doesn't exist, creating...`);
        // Table needs to be created - we'll use the API endpoint approach
        console.log(`⚠️  Please create ${table.name} table manually in Supabase dashboard`);
      } else {
        console.log(`✅ Table ${table.name} already exists`);
      }
    } catch (e) {
      console.error(`Error checking ${table.name}:`, e.message);
    }
  }
  
  // Insert default symbols
  console.log('\n📝 Inserting default symbols...');
  const defaultSymbols = [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'index', exchange: 'NYSE' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'index', exchange: 'NASDAQ' },
    { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', category: 'index', exchange: 'NYSE' },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF', category: 'index', exchange: 'NYSE' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', category: 'index', exchange: 'NYSE' },
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'stock', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stock', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stock', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'stock', exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms Inc.', category: 'stock', exchange: 'NASDAQ' },
    { symbol: 'BTC-USD', name: 'Bitcoin USD', category: 'crypto', exchange: 'CRYPTO' },
    { symbol: 'ETH-USD', name: 'Ethereum USD', category: 'crypto', exchange: 'CRYPTO' },
    { symbol: 'BNB-USD', name: 'Binance Coin USD', category: 'crypto', exchange: 'CRYPTO' }
  ];
  
  try {
    const { error } = await supabase
      .from('market_symbols')
      .upsert(defaultSymbols, { onConflict: 'symbol' });
    
    if (error) {
      console.log('⚠️  Could not insert symbols:', error.message);
      console.log('This is expected if the market_symbols table doesn\'t exist yet');
    } else {
      console.log('✅ Default symbols inserted');
    }
  } catch (e) {
    console.log('⚠️  Symbols table not ready:', e.message);
  }
  
  console.log('\n📋 MANUAL STEPS REQUIRED:');
  console.log('1. Go to: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new');
  console.log('2. Copy and run the SQL from create-market-data-tables.sql');
  console.log('3. After tables are created, run the cron setup');
  
  // Test if we can collect data
  console.log('\n🧪 Testing data collection capability...');
  try {
    const { count } = await supabase
      .from('market_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Market data table has ${count || 0} records`);
  } catch (e) {
    console.log('Market data table not accessible yet');
  }
}

deployTables().catch(console.error);