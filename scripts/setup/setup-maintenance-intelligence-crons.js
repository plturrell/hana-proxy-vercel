#!/usr/bin/env node

import fetch from 'node-fetch';

// Cron-job.org API configuration
const CRONJOB_API_KEY = '2HAna8iFwTHdWDReesbyqNUX9GIa9gg732GINNVNTk4=';
const CRONJOB_API_URL = 'https://api.cron-job.org/';

// Your endpoints
const BASE_URL = 'https://hana-proxy-vercel-95h9zguqh-plturrells-projects.vercel.app';

// System Maintenance cron configurations
const MAINTENANCE_CRON_CONFIGS = [
  {
    title: 'System Health Check - Every 30 Minutes',
    url: `${BASE_URL}/api/system-maintenance?action=health-check`,
    schedule: {
      minutes: [0, 30],
      hours: [-1], // All hours
      wdays: [-1]  // All days
    },
    description: 'Comprehensive system health monitoring'
  },
  {
    title: 'Database Optimization - Daily',
    url: `${BASE_URL}/api/system-maintenance?action=optimize-database`,
    schedule: {
      minutes: [0],
      hours: [3], // 3 AM EST
      wdays: [-1]
    },
    description: 'Optimize database tables and indexes'
  },
  {
    title: 'Log Cleanup - Daily',
    url: `${BASE_URL}/api/system-maintenance?action=cleanup-logs`,
    schedule: {
      minutes: [0],
      hours: [2], // 2 AM EST
      wdays: [-1]
    },
    description: 'Clean up old logs and archive if needed'
  },
  {
    title: 'Old Data Cleanup - Weekly',
    url: `${BASE_URL}/api/system-maintenance?action=cleanup-old-data`,
    schedule: {
      minutes: [0],
      hours: [4], // 4 AM EST
      wdays: [0] // Sunday only
    },
    description: 'Remove old market data and news articles'
  },
  {
    title: 'Storage Analysis - Daily',
    url: `${BASE_URL}/api/system-maintenance?action=analyze-storage`,
    schedule: {
      minutes: [0],
      hours: [1], // 1 AM EST
      wdays: [-1]
    },
    description: 'Analyze database storage usage'
  },
  {
    title: 'Index Maintenance - Weekly',
    url: `${BASE_URL}/api/system-maintenance?action=rebuild-indexes`,
    schedule: {
      minutes: [0],
      hours: [5], // 5 AM EST
      wdays: [6] // Saturday only
    },
    description: 'Rebuild fragmented indexes'
  },
  {
    title: 'Backup Verification - Daily',
    url: `${BASE_URL}/api/system-maintenance?action=verify-backups`,
    schedule: {
      minutes: [30],
      hours: [6], // 6:30 AM EST
      wdays: [-1]
    },
    description: 'Verify backup integrity'
  },
  {
    title: 'Maintenance Report - Daily',
    url: `${BASE_URL}/api/system-maintenance?action=maintenance-report`,
    schedule: {
      minutes: [0],
      hours: [7], // 7 AM EST
      wdays: [-1]
    },
    description: 'Generate daily maintenance report'
  }
];

// Financial Intelligence cron configurations
const INTELLIGENCE_CRON_CONFIGS = [
  {
    title: 'Sentiment Analysis - Every Hour',
    url: `${BASE_URL}/api/financial-intelligence?action=sentiment-analysis`,
    schedule: {
      minutes: [0],
      hours: [-1], // All hours
      wdays: [-1]
    },
    description: 'Analyze sentiment from recent news articles'
  },
  {
    title: 'Anomaly Detection - Every 15 Minutes',
    url: `${BASE_URL}/api/financial-intelligence?action=anomaly-detection`,
    schedule: {
      minutes: [0, 15, 30, 45],
      hours: [-1],
      wdays: [-1]
    },
    description: 'Detect market anomalies and unusual patterns'
  },
  {
    title: 'Correlation Analysis - Every 4 Hours',
    url: `${BASE_URL}/api/financial-intelligence?action=correlation-analysis`,
    schedule: {
      minutes: [0],
      hours: [0, 4, 8, 12, 16, 20],
      wdays: [-1]
    },
    description: 'Analyze asset correlations and relationships'
  },
  {
    title: 'Economic Indicators - Daily',
    url: `${BASE_URL}/api/financial-intelligence?action=economic-indicators`,
    schedule: {
      minutes: [30],
      hours: [8], // 8:30 AM EST
      wdays: [1, 2, 3, 4, 5] // Weekdays only
    },
    description: 'Calculate and process economic indicators'
  },
  {
    title: 'Market Predictions - Twice Daily',
    url: `${BASE_URL}/api/financial-intelligence?action=market-prediction`,
    schedule: {
      minutes: [0],
      hours: [9, 15], // 9 AM and 3 PM EST
      wdays: [1, 2, 3, 4, 5]
    },
    description: 'Generate market predictions based on patterns'
  },
  {
    title: 'Risk Signal Detection - Every 30 Minutes',
    url: `${BASE_URL}/api/financial-intelligence?action=risk-signals`,
    schedule: {
      minutes: [10, 40],
      hours: [-1],
      wdays: [-1]
    },
    description: 'Identify and analyze risk signals'
  },
  {
    title: 'News Impact Analysis - Every 2 Hours',
    url: `${BASE_URL}/api/financial-intelligence?action=news-impact`,
    schedule: {
      minutes: [15],
      hours: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
      wdays: [-1]
    },
    description: 'Analyze news impact on market movements'
  },
  {
    title: 'Sector Rotation Analysis - Daily',
    url: `${BASE_URL}/api/financial-intelligence?action=sector-rotation`,
    schedule: {
      minutes: [0],
      hours: [16], // 4 PM EST (after market close)
      wdays: [1, 2, 3, 4, 5]
    },
    description: 'Analyze sector rotation patterns'
  },
  {
    title: 'Intelligence Report - Daily',
    url: `${BASE_URL}/api/financial-intelligence?action=intelligence-report`,
    schedule: {
      minutes: [0],
      hours: [18], // 6 PM EST
      wdays: [1, 2, 3, 4, 5]
    },
    description: 'Generate comprehensive intelligence report'
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
        timezone: 'America/New_York',
        hours: config.schedule.hours || [-1],
        mdays: [-1],
        minutes: config.schedule.minutes || [0],
        months: [-1],
        wdays: config.schedule.wdays || [-1]
      },
      requestTimeout: 60, // Longer timeout for maintenance tasks
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

async function setupCronJobs(configs, title) {
  console.log(`\n🚀 SETTING UP ${title}`);
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const config of configs) {
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
  
  return results;
}

async function testEndpoints() {
  console.log('🧪 TESTING ENDPOINTS');
  console.log('='.repeat(50));
  
  // Test system maintenance
  console.log('\n1. Testing System Maintenance...');
  try {
    const response = await fetch(`${BASE_URL}/api/system-maintenance?action=status`);
    const data = await response.json();
    console.log('System Maintenance:', response.ok ? '✅ Working' : '❌ Failed');
    if (data.message) console.log(`   ${data.message}`);
  } catch (error) {
    console.log('❌ System Maintenance Error:', error.message);
  }
  
  // Test financial intelligence
  console.log('\n2. Testing Financial Intelligence...');
  try {
    const response = await fetch(`${BASE_URL}/api/financial-intelligence?action=status`);
    const data = await response.json();
    console.log('Financial Intelligence:', response.ok ? '✅ Working' : '❌ Failed');
    if (data.message) console.log(`   ${data.message}`);
  } catch (error) {
    console.log('❌ Financial Intelligence Error:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create-all':
      const maintenanceResults = await setupCronJobs(MAINTENANCE_CRON_CONFIGS, 'SYSTEM MAINTENANCE CRONS');
      const intelligenceResults = await setupCronJobs(INTELLIGENCE_CRON_CONFIGS, 'FINANCIAL INTELLIGENCE CRONS');
      
      console.log('\n📋 OVERALL SUMMARY:');
      console.log('='.repeat(50));
      console.log(`System Maintenance Jobs: ${maintenanceResults.length}`);
      console.log(`Financial Intelligence Jobs: ${intelligenceResults.length}`);
      console.log(`Total Jobs Created: ${maintenanceResults.length + intelligenceResults.length}`);
      
      console.log('\n🎉 ALL AUTOMATION COMPLETE!');
      console.log('Your financial system now has:');
      console.log('- News extraction every 5 minutes');
      console.log('- Market data collection 24/7');
      console.log('- Agent health monitoring');
      console.log('- Portfolio analytics');
      console.log('- GraphQL optimization');
      console.log('- System maintenance');
      console.log('- Financial intelligence processing');
      break;
      
    case 'create-maintenance':
      await setupCronJobs(MAINTENANCE_CRON_CONFIGS, 'SYSTEM MAINTENANCE CRONS');
      break;
      
    case 'create-intelligence':
      await setupCronJobs(INTELLIGENCE_CRON_CONFIGS, 'FINANCIAL INTELLIGENCE CRONS');
      break;
      
    case 'test':
      await testEndpoints();
      break;
      
    case 'list':
      try {
        const response = await fetch(`${CRONJOB_API_URL}jobs`, {
          headers: { 'Authorization': `Bearer ${CRONJOB_API_KEY}` }
        });
        const data = await response.json();
        console.log('\n📋 All cron jobs:');
        console.log('='.repeat(50));
        console.log(`Total jobs: ${data.jobs.length}`);
        
        // Group by category
        const categories = {
          'News': [],
          'Market Data': [],
          'Agent': [],
          'Portfolio': [],
          'GraphQL': [],
          'System': [],
          'Intelligence': []
        };
        
        data.jobs.forEach(job => {
          if (job.title.includes('News')) categories['News'].push(job);
          else if (job.title.includes('Market Data')) categories['Market Data'].push(job);
          else if (job.title.includes('Agent')) categories['Agent'].push(job);
          else if (job.title.includes('Portfolio')) categories['Portfolio'].push(job);
          else if (job.title.includes('GraphQL')) categories['GraphQL'].push(job);
          else if (job.title.includes('System') || job.title.includes('Maintenance')) categories['System'].push(job);
          else if (job.title.includes('Sentiment') || job.title.includes('Anomaly') || job.title.includes('Intelligence')) categories['Intelligence'].push(job);
        });
        
        for (const [category, jobs] of Object.entries(categories)) {
          if (jobs.length > 0) {
            console.log(`\n${category} (${jobs.length}):`);
            jobs.forEach(job => {
              console.log(`  - ${job.title} (ID: ${job.jobId})`);
              console.log(`    Status: ${job.enabled ? '✅ Enabled' : '❌ Disabled'}`);
            });
          }
        }
      } catch (error) {
        console.error('Error listing jobs:', error.message);
      }
      break;
      
    default:
      console.log('🔧 System Maintenance & Financial Intelligence Setup');
      console.log('='.repeat(50));
      console.log('\nCommands:');
      console.log('  test                - Test endpoints');
      console.log('  create-all          - Create all cron jobs');
      console.log('  create-maintenance  - Create maintenance jobs only');
      console.log('  create-intelligence - Create intelligence jobs only');
      console.log('  list                - List all existing cron jobs');
      console.log('\nExample:');
      console.log('  node setup-maintenance-intelligence-crons.js test');
      console.log('  node setup-maintenance-intelligence-crons.js create-all');
  }
}

// Run
main().catch(console.error);