import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function populateReferenceData() {
  console.log('🚀 POPULATING REFERENCE DATA TABLES');
  console.log('====================================\n');

  // 1. CURRENCIES
  console.log('💰 1. Populating currencies...');
  const currenciesData = [
    { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2 },
    { code: 'EUR', name: 'Euro', symbol: 'EUR', decimal_places: 2 },
    { code: 'GBP', name: 'British Pound', symbol: 'GBP', decimal_places: 2 },
    { code: 'JPY', name: 'Japanese Yen', symbol: 'JPY', decimal_places: 0 },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimal_places: 2 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CAD', decimal_places: 2 },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'AUD', decimal_places: 2 },
    { code: 'CNY', name: 'Chinese Yuan', symbol: 'CNY', decimal_places: 2 },
    { code: 'INR', name: 'Indian Rupee', symbol: 'INR', decimal_places: 2 },
    { code: 'KRW', name: 'South Korean Won', symbol: 'KRW', decimal_places: 0 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'SGD', decimal_places: 2 },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HKD', decimal_places: 2 }
  ];

  try {
    const { data: currencyResult, error: currencyError } = await supabase
      .from('currencies')
      .upsert(currenciesData, { onConflict: 'code' });
    
    if (currencyError) {
      console.log('❌ Currencies error:', currencyError.message);
    } else {
      console.log('✅ Currencies populated:', currenciesData.length, 'records');
    }
  } catch (e) {
    console.log('❌ Currencies exception:', e.message);
  }

  // 2. EXCHANGES
  console.log('\n🏢 2. Populating exchanges...');
  const exchangesData = [
    { code: 'NYSE', name: 'New York Stock Exchange', country: 'US', timezone: 'America/New_York', market_hours: '09:30-16:00' },
    { code: 'NASDAQ', name: 'NASDAQ Stock Market', country: 'US', timezone: 'America/New_York', market_hours: '09:30-16:00' },
    { code: 'LSE', name: 'London Stock Exchange', country: 'GB', timezone: 'Europe/London', market_hours: '08:00-16:30' },
    { code: 'TSE', name: 'Tokyo Stock Exchange', country: 'JP', timezone: 'Asia/Tokyo', market_hours: '09:00-15:00' },
    { code: 'HKEX', name: 'Hong Kong Exchange', country: 'HK', timezone: 'Asia/Hong_Kong', market_hours: '09:30-16:00' },
    { code: 'SSE', name: 'Shanghai Stock Exchange', country: 'CN', timezone: 'Asia/Shanghai', market_hours: '09:30-15:00' },
    { code: 'TSX', name: 'Toronto Stock Exchange', country: 'CA', timezone: 'America/Toronto', market_hours: '09:30-16:00' },
    { code: 'ASX', name: 'Australian Securities Exchange', country: 'AU', timezone: 'Australia/Sydney', market_hours: '10:00-16:00' }
  ];

  try {
    const { data: exchangeResult, error: exchangeError } = await supabase
      .from('exchanges')
      .upsert(exchangesData, { onConflict: 'code' });
    
    if (exchangeError) {
      console.log('❌ Exchanges error:', exchangeError.message);
    } else {
      console.log('✅ Exchanges populated:', exchangesData.length, 'records');
    }
  } catch (e) {
    console.log('❌ Exchanges exception:', e.message);
  }

  // 3. SECTORS
  console.log('\n🏭 3. Populating sectors...');
  const sectorsData = [
    { code: '10', name: 'Energy', description: 'Energy equipment, services and oil & gas exploration' },
    { code: '15', name: 'Materials', description: 'Chemicals, construction materials, metals & mining' },
    { code: '20', name: 'Industrials', description: 'Aerospace, defense, machinery, transportation' },
    { code: '25', name: 'Consumer Discretionary', description: 'Automobiles, retail, media & entertainment' },
    { code: '30', name: 'Consumer Staples', description: 'Food, beverages, tobacco, household products' },
    { code: '35', name: 'Health Care', description: 'Pharmaceuticals, biotechnology, medical equipment' },
    { code: '40', name: 'Financials', description: 'Banking, insurance, real estate, capital markets' },
    { code: '45', name: 'Information Technology', description: 'Software, hardware, semiconductors, IT services' },
    { code: '50', name: 'Communication Services', description: 'Telecommunication, media & entertainment' },
    { code: '55', name: 'Utilities', description: 'Electric, gas, water utilities and renewable energy' },
    { code: '60', name: 'Real Estate', description: 'Real estate investment trusts and management' }
  ];

  try {
    const { data: sectorResult, error: sectorError } = await supabase
      .from('sectors')
      .upsert(sectorsData, { onConflict: 'code' });
    
    if (sectorError) {
      console.log('❌ Sectors error:', sectorError.message);
    } else {
      console.log('✅ Sectors populated:', sectorsData.length, 'records');
    }
  } catch (e) {
    console.log('❌ Sectors exception:', e.message);
  }

  // 4. ASSET CLASSES
  console.log('\n📊 4. Populating asset classes...');
  const assetClassesData = [
    { code: 'EQ', name: 'Equity', description: 'Stocks and equity-based instruments', risk_level: 'Medium' },
    { code: 'FI', name: 'Fixed Income', description: 'Bonds and debt securities', risk_level: 'Low' },
    { code: 'FX', name: 'Foreign Exchange', description: 'Currency pairs and forex instruments', risk_level: 'High' },
    { code: 'CR', name: 'Cryptocurrency', description: 'Digital currencies and crypto assets', risk_level: 'High' },
    { code: 'CM', name: 'Commodities', description: 'Physical commodities and futures', risk_level: 'Medium' },
    { code: 'CA', name: 'Cash', description: 'Cash equivalents and money market instruments', risk_level: 'Low' }
  ];

  try {
    const { data: assetResult, error: assetError } = await supabase
      .from('asset_classes')
      .upsert(assetClassesData, { onConflict: 'code' });
    
    if (assetError) {
      console.log('❌ Asset classes error:', assetError.message);
    } else {
      console.log('✅ Asset classes populated:', assetClassesData.length, 'records');
    }
  } catch (e) {
    console.log('❌ Asset classes exception:', e.message);
  }

  // 5. COUNTRIES
  console.log('\n🌍 5. Populating countries...');
  const countriesData = [
    { code: 'US', name: 'United States', continent: 'North America', currency_code: 'USD', market_status: 'Developed' },
    { code: 'GB', name: 'United Kingdom', continent: 'Europe', currency_code: 'GBP', market_status: 'Developed' },
    { code: 'DE', name: 'Germany', continent: 'Europe', currency_code: 'EUR', market_status: 'Developed' },
    { code: 'JP', name: 'Japan', continent: 'Asia', currency_code: 'JPY', market_status: 'Developed' },
    { code: 'CA', name: 'Canada', continent: 'North America', currency_code: 'CAD', market_status: 'Developed' },
    { code: 'AU', name: 'Australia', continent: 'Oceania', currency_code: 'AUD', market_status: 'Developed' },
    { code: 'CN', name: 'China', continent: 'Asia', currency_code: 'CNY', market_status: 'Emerging' },
    { code: 'IN', name: 'India', continent: 'Asia', currency_code: 'INR', market_status: 'Emerging' },
    { code: 'HK', name: 'Hong Kong', continent: 'Asia', currency_code: 'HKD', market_status: 'Developed' },
    { code: 'SG', name: 'Singapore', continent: 'Asia', currency_code: 'SGD', market_status: 'Developed' }
  ];

  try {
    const { data: countryResult, error: countryError } = await supabase
      .from('countries')
      .upsert(countriesData, { onConflict: 'code' });
    
    if (countryError) {
      console.log('❌ Countries error:', countryError.message);
    } else {
      console.log('✅ Countries populated:', countriesData.length, 'records');
    }
  } catch (e) {
    console.log('❌ Countries exception:', e.message);
  }

  // Verify results
  console.log('\n🔍 VERIFICATION');
  console.log('================');
  
  const tables = ['currencies', 'exchanges', 'sectors', 'asset_classes', 'countries'];
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`✅ ${table}: ${count || 0} records`);
      } else {
        console.log(`❌ ${table}: Error - ${error.message}`);
      }
    } catch (e) {
      console.log(`❌ ${table}: Exception - ${e.message}`);
    }
  }

  console.log('\n🎉 REFERENCE DATA POPULATION COMPLETE!');
}

populateReferenceData().catch(console.error);