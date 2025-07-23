#!/usr/bin/env node

import fetch from 'node-fetch';

// Cron-job.org API configuration
const CRONJOB_API_KEY = '2HAna8iFwTHdWDReesbyqNUX9GIa9gg732GINNVNTk4=';
const CRONJOB_API_URL = 'https://api.cron-job.org/';

// Your unified market data collector endpoint
const COLLECTOR_URL = 'https://hana-proxy-vercel-95h9zguqh-plturrells-projects.vercel.app/api/market-data-collector';

// Market data collection configurations
const CRON_CONFIGS = [
  {
    title: 'Market Data - Indices & Major Stocks (Market Hours)',
    url: `${COLLECTOR_URL}?action=collect&category=indices,stocks&sources=fmp,finnhub`,
    schedule: {
      // Every 15 minutes during market hours (9:30 AM - 4:00 PM EST)
      minutes: [0, 15, 30, 45],
      hours: [9, 10, 11, 12, 13, 14, 15, 16],
      wdays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    description: 'Collect indices and stock data during market hours'
  },
  {
    title: 'Market Data - Crypto (24/7)',
    url: `${COLLECTOR_URL}?action=collect&category=crypto&sources=fmp,finnhub`,
    schedule: {
      // Every 30 minutes for crypto
      minutes: [0, 30],
      hours: [-1], // All hours
      wdays: [-1]  // All days
    },
    description: 'Monitor cryptocurrency prices 24/7'
  },
  {
    title: 'Market Data - Pre-Market Check',
    url: `${COLLECTOR_URL}?action=collect&category=indices&sources=fmp`,
    schedule: {
      // Once at 9 AM EST (pre-market)
      minutes: [0],
      hours: [9],
      wdays: [1, 2, 3, 4, 5]
    },
    description: 'Pre-market data collection'
  },
  {
    title: 'Market Data - After Hours Check',
    url: `${COLLECTOR_URL}?action=collect&category=stocks&sources=fmp`,
    schedule: {
      // At 5 PM and 7 PM EST for after-hours
      minutes: [0],
      hours: [17, 19],
      wdays: [1, 2, 3, 4, 5]
    },
    description: 'After-hours market movement check'
  },
  {
    title: 'Market Data - Daily Cleanup',
    url: `${COLLECTOR_URL}?action=cleanup`,
    schedule: {
      // Once daily at 2 AM EST
      minutes: [0],
      hours: [2],
      wdays: [-1]
    },
    description: 'Clean up old market data records'
  }
];

async function createCronJob(config) {
  console.log(`\n📊 Creating: ${config.title}`);
  
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
      requestTimeout: 60, // Increased timeout for multiple symbols
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
    console.log(`   ${config.description}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Error creating cron job: ${error.message}`);
    return null;
  }
}

async function setupAllCronJobs() {
  console.log('🚀 SETTING UP UNIFIED MARKET DATA COLLECTION');
  console.log('='.repeat(50));
  console.log(`\nCollector endpoint: ${COLLECTOR_URL}`);
  
  const results = [];
  
  for (const config of CRON_CONFIGS) {
    const result = await createCronJob(config);
    if (result) {
      results.push({
        jobId: result.jobId,
        title: config.title,
        description: config.description,
        url: config.url
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
  }
  
  console.log('\n📊 MONITORING COMMANDS:');
  console.log('Check collection status:');
  console.log(`curl "${COLLECTOR_URL}?action=status" | jq`);
  console.log('\nView latest prices:');
  console.log('SELECT * FROM latest_market_prices LIMIT 10;');
}

async function testCollectorEndpoint() {
  console.log('🧪 TESTING MARKET DATA COLLECTOR');
  console.log('='.repeat(50));
  
  // Test status
  console.log('\n1. Testing status endpoint...');
  try {
    const statusResponse = await fetch(`${COLLECTOR_URL}?action=status`);
    const statusData = await statusResponse.json();
    console.log('Status:', statusData.status);
    console.log('Data points collected:', statusData.dataPointsLastHour);
    console.log('Unique symbols:', statusData.uniqueSymbols);
  } catch (error) {
    console.log('❌ Status Error:', error.message);
  }
  
  // Test collection with a few symbols
  console.log('\n2. Testing data collection...');
  try {
    const collectResponse = await fetch(`${COLLECTOR_URL}?action=collect&symbols=AAPL,MSFT,SPY&sources=fmp`);
    const collectData = await collectResponse.json();
    console.log('Collection success:', collectData.success);
    console.log('Symbols collected:', collectData.collected);
    console.log('Failed:', collectData.failed);
    console.log('Duplicates skipped:', collectData.duplicates);
  } catch (error) {
    console.log('❌ Collection Error:', error.message);
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
      await testCollectorEndpoint();
      break;
      
    case 'list':
      try {
        const response = await fetch(`${CRONJOB_API_URL}jobs`, {
          headers: { 'Authorization': `Bearer ${CRONJOB_API_KEY}` }
        });
        const data = await response.json();
        console.log('\n📋 All cron jobs:');
        console.log('='.repeat(50));
        data.jobs.forEach((job, index) => {
          console.log(`\n${index + 1}. ${job.title}`);
          console.log(`   ID: ${job.jobId}`);
          console.log(`   Status: ${job.enabled ? '✅ Enabled' : '❌ Disabled'}`);
          console.log(`   URL: ${job.url}`);
          const nextRun = new Date(job.nextExecution * 1000);
          console.log(`   Next run: ${nextRun.toLocaleString()}`);
        });
      } catch (error) {
        console.error('Error listing jobs:', error.message);
      }
      break;
      
    default:
      console.log('📈 Unified Market Data Collection Setup');
      console.log('='.repeat(40));
      console.log('\nCommands:');
      console.log('  test    - Test the collector endpoint');
      console.log('  create  - Create all market data cron jobs');
      console.log('  list    - List all existing cron jobs');
      console.log('\nExample:');
      console.log('  node setup-market-crons-unified.js test');
      console.log('  node setup-market-crons-unified.js create');
      console.log('\nNOTE: Make sure to create the database tables first!');
      console.log('Run the SQL in create-market-data-tables.sql');
  }
}

// Run
main().catch(console.error);