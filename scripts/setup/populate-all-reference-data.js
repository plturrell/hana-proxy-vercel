import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function populateAllReferenceData() {
  console.log('🚀 POPULATING ALL 19 REFERENCE DATA TABLES');
  console.log('==========================================\n');

  let totalRecords = 0;
  let tablesPopulated = 0;

  // 6. INDUSTRIES (related to sectors)
  console.log('🏭 6. Populating industries...');
  const industriesData = [
    { code: '101010', name: 'Oil & Gas Drilling', sector_code: '10', description: 'Oil and gas drilling companies' },
    { code: '151010', name: 'Chemicals', sector_code: '15', description: 'Diversified chemical companies' },
    { code: '201010', name: 'Aerospace & Defense', sector_code: '20', description: 'Aerospace and defense equipment' },
    { code: '251010', name: 'Auto Components', sector_code: '25', description: 'Automotive parts and equipment' },
    { code: '301010', name: 'Food Products', sector_code: '30', description: 'Packaged foods and meat products' },
    { code: '351010', name: 'Pharmaceuticals', sector_code: '35', description: 'Pharmaceutical preparations' },
    { code: '401010', name: 'Commercial Banks', sector_code: '40', description: 'Commercial banking services' },
    { code: '451010', name: 'Software', sector_code: '45', description: 'Application and systems software' },
    { code: '501010', name: 'Diversified Telecom', sector_code: '50', description: 'Telecommunications services' },
    { code: '551010', name: 'Electric Utilities', sector_code: '55', description: 'Electric power generation' },
    { code: '601010', name: 'Equity REITs', sector_code: '60', description: 'Real estate investment trusts' }
  ];

  try {
    const { error } = await supabase.from('industries').upsert(industriesData, { onConflict: 'code' });
    if (!error) {
      console.log('✅ Industries populated:', industriesData.length, 'records');
      totalRecords += industriesData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Industries error:', error.message);
    }
  } catch (e) {
    console.log('❌ Industries exception:', e.message);
  }

  // 7. RISK RATINGS
  console.log('\n📊 7. Populating risk ratings...');
  const riskRatingsData = [
    { code: 'VL', name: 'Very Low', description: 'Minimal risk, highly stable investments', numeric_value: 1 },
    { code: 'L', name: 'Low', description: 'Conservative investments with limited volatility', numeric_value: 2 },
    { code: 'ML', name: 'Medium-Low', description: 'Moderate risk with some volatility', numeric_value: 3 },
    { code: 'M', name: 'Medium', description: 'Balanced risk-return profile', numeric_value: 4 },
    { code: 'MH', name: 'Medium-High', description: 'Higher risk with increased return potential', numeric_value: 5 },
    { code: 'H', name: 'High', description: 'Significant risk and volatility', numeric_value: 6 },
    { code: 'VH', name: 'Very High', description: 'Extremely high risk, speculative investments', numeric_value: 7 },
    { code: 'E', name: 'Extreme', description: 'Maximum risk, highly speculative', numeric_value: 8 }
  ];

  try {
    const { error } = await supabase.from('risk_ratings').upsert(riskRatingsData, { onConflict: 'code' });
    if (!error) {
      console.log('✅ Risk ratings populated:', riskRatingsData.length, 'records');
      totalRecords += riskRatingsData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Risk ratings error:', error.message);
    }
  } catch (e) {
    console.log('❌ Risk ratings exception:', e.message);
  }

  // 8. CREDIT RATINGS
  console.log('\n💳 8. Populating credit ratings...');
  const creditRatingsData = [
    { agency: 'Moodys', rating: 'Aaa', description: 'Highest quality, minimal credit risk', investment_grade: true, numeric_value: 1 },
    { agency: 'Moodys', rating: 'Aa1', description: 'High quality, very low credit risk', investment_grade: true, numeric_value: 2 },
    { agency: 'Moodys', rating: 'Aa2', description: 'High quality, low credit risk', investment_grade: true, numeric_value: 3 },
    { agency: 'Moodys', rating: 'Aa3', description: 'High quality, low credit risk', investment_grade: true, numeric_value: 4 },
    { agency: 'Moodys', rating: 'A1', description: 'Upper medium grade, low credit risk', investment_grade: true, numeric_value: 5 },
    { agency: 'SP', rating: 'AAA', description: 'Highest quality, minimal credit risk', investment_grade: true, numeric_value: 1 },
    { agency: 'SP', rating: 'AA+', description: 'High quality, very low credit risk', investment_grade: true, numeric_value: 2 },
    { agency: 'SP', rating: 'AA', description: 'High quality, very low credit risk', investment_grade: true, numeric_value: 3 },
    { agency: 'SP', rating: 'AA-', description: 'High quality, very low credit risk', investment_grade: true, numeric_value: 4 },
    { agency: 'SP', rating: 'A+', description: 'Upper medium grade, low credit risk', investment_grade: true, numeric_value: 5 },
    { agency: 'Fitch', rating: 'AAA', description: 'Highest quality, minimal credit risk', investment_grade: true, numeric_value: 1 },
    { agency: 'Fitch', rating: 'AA+', description: 'High quality, very low credit risk', investment_grade: true, numeric_value: 2 }
  ];

  try {
    const { error } = await supabase.from('credit_ratings').upsert(creditRatingsData, { onConflict: ['agency', 'rating'] });
    if (!error) {
      console.log('✅ Credit ratings populated:', creditRatingsData.length, 'records');
      totalRecords += creditRatingsData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Credit ratings error:', error.message);
    }
  } catch (e) {
    console.log('❌ Credit ratings exception:', e.message);
  }

  // 9. TIME ZONES
  console.log('\n🕐 9. Populating time zones...');
  const timeZonesData = [
    { code: 'EST', name: 'Eastern Standard Time', utc_offset: '-05:00', dst_observed: true },
    { code: 'PST', name: 'Pacific Standard Time', utc_offset: '-08:00', dst_observed: true },
    { code: 'GMT', name: 'Greenwich Mean Time', utc_offset: '+00:00', dst_observed: true },
    { code: 'CET', name: 'Central European Time', utc_offset: '+01:00', dst_observed: true },
    { code: 'JST', name: 'Japan Standard Time', utc_offset: '+09:00', dst_observed: false },
    { code: 'AEST', name: 'Australian Eastern Standard Time', utc_offset: '+10:00', dst_observed: true },
    { code: 'HKT', name: 'Hong Kong Time', utc_offset: '+08:00', dst_observed: false },
    { code: 'SGT', name: 'Singapore Time', utc_offset: '+08:00', dst_observed: false }
  ];

  try {
    const { error } = await supabase.from('time_zones').upsert(timeZonesData, { onConflict: 'code' });
    if (!error) {
      console.log('✅ Time zones populated:', timeZonesData.length, 'records');
      totalRecords += timeZonesData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Time zones error:', error.message);
    }
  } catch (e) {
    console.log('❌ Time zones exception:', e.message);
  }

  // 10. MARKET CALENDARS
  console.log('\n📅 10. Populating market calendars...');
  const marketCalendarsData = [
    { exchange_code: 'NYSE', date: '2025-01-01', name: 'New Year Day', type: 'Holiday', is_trading_day: false },
    { exchange_code: 'NYSE', date: '2025-07-04', name: 'Independence Day', type: 'Holiday', is_trading_day: false },
    { exchange_code: 'NYSE', date: '2025-12-25', name: 'Christmas Day', type: 'Holiday', is_trading_day: false },
    { exchange_code: 'LSE', date: '2025-01-01', name: 'New Year Day', type: 'Holiday', is_trading_day: false },
    { exchange_code: 'LSE', date: '2025-04-18', name: 'Good Friday', type: 'Holiday', is_trading_day: false },
    { exchange_code: 'LSE', date: '2025-12-25', name: 'Christmas Day', type: 'Holiday', is_trading_day: false }
  ];

  try {
    const { error } = await supabase.from('market_calendars').upsert(marketCalendarsData, { onConflict: ['exchange_code', 'date'] });
    if (!error) {
      console.log('✅ Market calendars populated:', marketCalendarsData.length, 'records');
      totalRecords += marketCalendarsData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Market calendars error:', error.message);
    }
  } catch (e) {
    console.log('❌ Market calendars exception:', e.message);
  }

  // 11. HOLIDAYS
  console.log('\n🎉 11. Populating holidays...');
  const holidaysData = [
    { country_code: 'US', date: '2025-01-01', name: 'New Year Day', type: 'National' },
    { country_code: 'US', date: '2025-07-04', name: 'Independence Day', type: 'National' },
    { country_code: 'US', date: '2025-11-27', name: 'Thanksgiving', type: 'National' },
    { country_code: 'GB', date: '2025-01-01', name: 'New Year Day', type: 'National' },
    { country_code: 'GB', date: '2025-12-25', name: 'Christmas Day', type: 'National' },
    { country_code: 'GB', date: '2025-12-26', name: 'Boxing Day', type: 'National' }
  ];

  try {
    const { error } = await supabase.from('holidays').upsert(holidaysData, { onConflict: ['country_code', 'date'] });
    if (!error) {
      console.log('✅ Holidays populated:', holidaysData.length, 'records');
      totalRecords += holidaysData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Holidays error:', error.message);
    }
  } catch (e) {
    console.log('❌ Holidays exception:', e.message);
  }

  // 12. REF_DATA (Generic reference data)
  console.log('\n📚 12. Populating ref_data...');
  const refData = [
    { category: 'market_status', code: 'OPEN', name: 'Market Open', description: 'Trading is active', value: 'true', sort_order: 1 },
    { category: 'market_status', code: 'CLOSED', name: 'Market Closed', description: 'Trading is halted', value: 'false', sort_order: 2 },
    { category: 'market_status', code: 'PRE_MARKET', name: 'Pre-Market', description: 'Pre-market trading', value: 'true', sort_order: 3 },
    { category: 'market_status', code: 'AFTER_HOURS', name: 'After Hours', description: 'After hours trading', value: 'true', sort_order: 4 },
    { category: 'order_type', code: 'MARKET', name: 'Market Order', description: 'Execute at current market price', value: 'market', sort_order: 1 },
    { category: 'order_type', code: 'LIMIT', name: 'Limit Order', description: 'Execute at specified price or better', value: 'limit', sort_order: 2 },
    { category: 'order_type', code: 'STOP', name: 'Stop Order', description: 'Trigger order at stop price', value: 'stop', sort_order: 3 }
  ];

  try {
    const { error } = await supabase.from('ref_data').upsert(refData, { onConflict: ['category', 'code'] });
    if (!error) {
      console.log('✅ Ref data populated:', refData.length, 'records');
      totalRecords += refData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Ref data error:', error.message);
    }
  } catch (e) {
    console.log('❌ Ref data exception:', e.message);
  }

  // 13. CONSTANTS
  console.log('\n🔢 13. Populating constants...');
  const constantsData = [
    { name: 'TRADING_DAYS_PER_YEAR', value: '252', data_type: 'integer', category: 'market', description: 'Standard trading days per year' },
    { name: 'RISK_FREE_RATE', value: '0.045', data_type: 'float', category: 'market', description: 'Current risk-free rate' },
    { name: 'MAX_POSITION_SIZE', value: '0.10', data_type: 'float', category: 'risk', description: 'Maximum position size as portfolio percentage' },
    { name: 'DEFAULT_SLIPPAGE', value: '0.001', data_type: 'float', category: 'trading', description: 'Default slippage assumption' },
    { name: 'MIN_TRADE_SIZE', value: '100', data_type: 'integer', category: 'trading', description: 'Minimum trade size in USD' }
  ];

  try {
    const { error } = await supabase.from('constants').upsert(constantsData, { onConflict: 'name' });
    if (!error) {
      console.log('✅ Constants populated:', constantsData.length, 'records');
      totalRecords += constantsData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Constants error:', error.message);
    }
  } catch (e) {
    console.log('❌ Constants exception:', e.message);
  }

  // 14. CONFIGURATIONS
  console.log('\n⚙️ 14. Populating configurations...');
  const configurationsData = [
    { 
      key: 'market_data_providers', 
      value: { providers: ['yahoo', 'alpha_vantage', 'polygon'], default: 'yahoo' },
      description: 'Available market data providers',
      environment: 'production'
    },
    { 
      key: 'trading_hours', 
      value: { NYSE: { open: '09:30', close: '16:00' }, LSE: { open: '08:00', close: '16:30' } },
      description: 'Trading hours by exchange',
      environment: 'production'
    },
    { 
      key: 'api_rate_limits', 
      value: { default: 100, premium: 1000, enterprise: 10000 },
      description: 'API rate limits per minute by tier',
      environment: 'production'
    }
  ];

  try {
    const { error } = await supabase.from('configurations').upsert(configurationsData, { onConflict: 'key' });
    if (!error) {
      console.log('✅ Configurations populated:', configurationsData.length, 'records');
      totalRecords += configurationsData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Configurations error:', error.message);
    }
  } catch (e) {
    console.log('❌ Configurations exception:', e.message);
  }

  // 15. PARAMETERS
  console.log('\n📊 15. Populating parameters...');
  const parametersData = [
    { name: 'volatility_window', value: '20', data_type: 'integer', category: 'calculation', description: 'Days for volatility calculation', min_value: 10, max_value: 252 },
    { name: 'correlation_window', value: '60', data_type: 'integer', category: 'calculation', description: 'Days for correlation calculation', min_value: 20, max_value: 252 },
    { name: 'var_confidence', value: '0.95', data_type: 'float', category: 'risk', description: 'VaR confidence level', min_value: 0.90, max_value: 0.99 },
    { name: 'sharpe_threshold', value: '1.0', data_type: 'float', category: 'performance', description: 'Minimum acceptable Sharpe ratio', min_value: 0, max_value: 3 }
  ];

  try {
    const { error } = await supabase.from('parameters').upsert(parametersData, { onConflict: 'name' });
    if (!error) {
      console.log('✅ Parameters populated:', parametersData.length, 'records');
      totalRecords += parametersData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Parameters error:', error.message);
    }
  } catch (e) {
    console.log('❌ Parameters exception:', e.message);
  }

  // 16. ENUMS
  console.log('\n🏷️ 16. Populating enums...');
  const enumsData = [
    { enum_type: 'order_status', value: 'pending', display_name: 'Pending', sort_order: 1 },
    { enum_type: 'order_status', value: 'filled', display_name: 'Filled', sort_order: 2 },
    { enum_type: 'order_status', value: 'cancelled', display_name: 'Cancelled', sort_order: 3 },
    { enum_type: 'order_status', value: 'rejected', display_name: 'Rejected', sort_order: 4 },
    { enum_type: 'agent_status', value: 'active', display_name: 'Active', sort_order: 1 },
    { enum_type: 'agent_status', value: 'inactive', display_name: 'Inactive', sort_order: 2 },
    { enum_type: 'agent_status', value: 'suspended', display_name: 'Suspended', sort_order: 3 }
  ];

  try {
    const { error } = await supabase.from('enums').upsert(enumsData, { onConflict: ['enum_type', 'value'] });
    if (!error) {
      console.log('✅ Enums populated:', enumsData.length, 'records');
      totalRecords += enumsData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Enums error:', error.message);
    }
  } catch (e) {
    console.log('❌ Enums exception:', e.message);
  }

  // 17. TYPES
  console.log('\n📝 17. Populating types...');
  const typesData = [
    { 
      name: 'market_order', 
      category: 'trading', 
      description: 'Market order structure',
      validation_schema: { type: 'object', properties: { symbol: { type: 'string' }, quantity: { type: 'number' }, side: { enum: ['buy', 'sell'] } } },
      example_value: '{"symbol": "AAPL", "quantity": 100, "side": "buy"}'
    },
    { 
      name: 'portfolio_position', 
      category: 'portfolio', 
      description: 'Portfolio position structure',
      validation_schema: { type: 'object', properties: { symbol: { type: 'string' }, shares: { type: 'number' }, cost_basis: { type: 'number' } } },
      example_value: '{"symbol": "MSFT", "shares": 50, "cost_basis": 250.00}'
    }
  ];

  try {
    const { error } = await supabase.from('types').upsert(typesData, { onConflict: 'name' });
    if (!error) {
      console.log('✅ Types populated:', typesData.length, 'records');
      totalRecords += typesData.length;
      tablesPopulated++;
    } else {
      console.log('❌ Types error:', error.message);
    }
  } catch (e) {
    console.log('❌ Types exception:', e.message);
  }

  // Final verification
  console.log('\n🔍 FINAL VERIFICATION');
  console.log('=====================');
  
  const allTables = [
    'currencies', 'exchanges', 'sectors', 'industries', 'asset_classes',
    'risk_ratings', 'credit_ratings', 'countries', 'time_zones',
    'market_calendars', 'holidays', 'ref_data', 'lookup_tables',
    'constants', 'configurations', 'settings', 'parameters', 'enums', 'types'
  ];

  let populatedCount = 0;
  for (const table of allTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error && count > 0) {
        console.log(`✅ ${table}: ${count} records`);
        populatedCount++;
      } else if (!error && count === 0) {
        console.log(`⚠️ ${table}: Empty (0 records)`);
      } else {
        console.log(`❌ ${table}: Error - ${error?.message}`);
      }
    } catch (e) {
      console.log(`❌ ${table}: Exception - ${e.message}`);
    }
  }

  console.log('\n🎉 REFERENCE DATA POPULATION COMPLETE!');
  console.log('======================================');
  console.log(`Total records inserted: ${totalRecords}`);
  console.log(`Tables populated: ${tablesPopulated}/19`);
  console.log(`Tables with data: ${populatedCount}/19`);
}

populateAllReferenceData().catch(console.error);