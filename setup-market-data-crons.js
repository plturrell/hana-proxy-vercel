#!/usr/bin/env node

import fetch from 'node-fetch';

// Cron-job.org API configuration
const CRONJOB_API_KEY = '2HAna8iFwTHdWDReesbyqNUX9GIa9gg732GINNVNTk4=';
const CRONJOB_API_URL = 'https://api.cron-job.org/';

// Your market data endpoints
const BASE_URL = 'https://hana-proxy-vercel-9hxhhmdqe-plturrells-projects.vercel.app';

// Popular symbols to track
const MARKET_SYMBOLS = [
  'SPY',   // S&P 500 ETF
  'QQQ',   // Nasdaq 100 ETF
  'DIA',   // Dow Jones ETF
  'AAPL',  // Apple
  'MSFT',  // Microsoft
  'GOOGL', // Google
  'AMZN',  // Amazon
  'TSLA',  // Tesla
  'BTC-USD', // Bitcoin
  'ETH-USD'  // Ethereum
];

// Market data collection configurations
const CRON_CONFIGS = [
  {
    title: 'FMP Market Data - Quotes Collection',
    url: `${BASE_URL}/api/market-data-fmp?action=quotes&symbols=${JSON.stringify(MARKET_SYMBOLS)}`,
    schedule: {
      // Every 15 minutes during market hours (9:30 AM - 4:00 PM EST)
      minutes: [0, 15, 30, 45],
      hours: [9, 10, 11, 12, 13, 14, 15, 16], // Adjust for your timezone
      wdays: [1, 2, 3, 4, 5] // Monday to Friday only
    },
    description: 'Collect real-time quotes from Financial Modeling Prep'
  },
  {
    title: 'Finnhub Market Data - Quotes Collection',
    url: `${BASE_URL}/api/market-data-finhub?action=quotes&symbols=${JSON.stringify(MARKET_SYMBOLS)}`,
    schedule: {
      // Every 15 minutes, offset by 5 minutes from FMP
      minutes: [5, 20, 35, 50],
      hours: [9, 10, 11, 12, 13, 14, 15, 16],
      wdays: [1, 2, 3, 4, 5]
    },
    description: 'Collect real-time quotes from Finnhub'
  },
  {
    title: 'Market Data - After Hours Check',
    url: `${BASE_URL}/api/market-data-unified?action=afterhours&symbols=${JSON.stringify(['SPY', 'QQQ', 'AAPL', 'TSLA'])}`,
    schedule: {
      // Once at 5 PM and 8 PM for after-hours data
      minutes: [0],
      hours: [17, 20],
      wdays: [1, 2, 3, 4, 5]
    },
    description: 'Check after-hours market movement'
  },
  {
    title: 'Crypto Market Data - 24/7',
    url: `${BASE_URL}/api/market-data-unified?action=quotes&symbols=${JSON.stringify(['BTC-USD', 'ETH-USD'])}`,
    schedule: {
      // Every 30 minutes for crypto (24/7)
      minutes: [0, 30],
      hours: [-1], // All hours
      wdays: [-1]  // All days
    },
    description: 'Monitor cryptocurrency prices round the clock'
  }
];

async function createCronJob(config) {
  console.log(`\n📊 Creating: ${config.title}`);
  console.log(`URL: ${config.url}`);
  
  const cronJobData = {
    job: {
      url: config.url,
      enabled: true,
      title: config.title,
      saveResponses: true,
      schedule: {
        timezone: 'America/New_York', // NYSE timezone
        hours: config.schedule.hours || [-1],
        mdays: [-1],
        minutes: config.schedule.minutes || [0],
        months: [-1],
        wdays: config.schedule.wdays || [-1]
      },
      requestTimeout: 30,
      redirectSuccess: true,
      requestMethod: 0, // GET
      notifyFailure: true,
      notifySuccess: false,
      auth: {
        enable: false
      }
    }
  };

  try {
    const response = await fetch(`${CRONJOB_API_URL}jobs`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CRONJOB_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cronJobData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Created successfully! Job ID: ${result.jobId}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Error creating cron job: ${error.message}`);
    return null;
  }
}

async function setupAllCronJobs() {
  console.log('🚀 SETTING UP MARKET DATA CRON JOBS');
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const config of CRON_CONFIGS) {
    const result = await createCronJob(config);
    if (result) {
      results.push({
        jobId: result.jobId,
        title: config.title,
        description: config.description
      });
    }
    
    // Small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('='.repeat(50));
  console.log(`Total jobs created: ${results.length}/${CRON_CONFIGS.length}`);
  
  if (results.length > 0) {
    console.log('\n✅ Successfully created jobs:');
    results.forEach((job, index) => {
      console.log(`\n${index + 1}. ${job.title}`);
      console.log(`   Job ID: ${job.jobId}`);
      console.log(`   ${job.description}`);
    });
    
    // Save job IDs for monitoring
    const jobIds = results.map(r => r.jobId);
    console.log('\n📌 Job IDs for monitoring:', JSON.stringify(jobIds));
  }
}

// Alternative: Test endpoints first
async function testMarketEndpoints() {
  console.log('🧪 TESTING MARKET DATA ENDPOINTS');
  console.log('='.repeat(50));
  
  const testSymbol = 'AAPL';
  
  // Test FMP
  console.log('\n1. Testing FMP endpoint...');
  try {
    const fmpResponse = await fetch(`${BASE_URL}/api/market-data-fmp?action=quote&symbol=${testSymbol}`);
    const fmpData = await fmpResponse.json();
    console.log('FMP Response:', fmpData.success ? '✅ Working' : '❌ Failed');
    if (fmpData.data) {
      console.log(`   ${testSymbol} Price: $${fmpData.data.price}`);
    }
  } catch (error) {
    console.log('❌ FMP Error:', error.message);
  }
  
  // Test Finnhub
  console.log('\n2. Testing Finnhub endpoint...');
  try {
    const finnhubResponse = await fetch(`${BASE_URL}/api/market-data-finhub?action=quote&symbol=${testSymbol}`);
    const finnhubData = await finnhubResponse.json();
    console.log('Finnhub Response:', finnhubData.success ? '✅ Working' : '❌ Failed');
    if (finnhubData.data) {
      console.log(`   ${testSymbol} Price: $${finnhubData.data.price}`);
    }
  } catch (error) {
    console.log('❌ Finnhub Error:', error.message);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      await setupAllCronJobs();
      break;
      
    case 'test':
      await testMarketEndpoints();
      break;
      
    case 'list':
      // List existing jobs
      try {
        const response = await fetch(`${CRONJOB_API_URL}jobs`, {
          headers: { 'Authorization': `Bearer ${CRONJOB_API_KEY}` }
        });
        const data = await response.json();
        console.log('\n📋 Existing cron jobs:');
        data.jobs.forEach((job, index) => {
          console.log(`${index + 1}. ${job.title} (ID: ${job.jobId})`);
          console.log(`   Status: ${job.enabled ? 'Enabled' : 'Disabled'}`);
          console.log(`   URL: ${job.url}`);
        });
      } catch (error) {
        console.error('Error listing jobs:', error.message);
      }
      break;
      
    default:
      console.log('📈 Market Data Cron Setup');
      console.log('='.repeat(30));
      console.log('\nCommands:');
      console.log('  test    - Test market data endpoints');
      console.log('  create  - Create all market data cron jobs');
      console.log('  list    - List existing cron jobs');
      console.log('\nExample:');
      console.log('  node setup-market-data-crons.js test');
      console.log('  node setup-market-data-crons.js create');
  }
}

// Run
main().catch(console.error);