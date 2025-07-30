#!/usr/bin/env node

import fetch from 'node-fetch';

// Cron-job.org API configuration
const CRONJOB_API_KEY = '2HAna8iFwTHdWDReesbyqNUX9GIa9gg732GINNVNTk4=';
const CRONJOB_API_URL = 'https://api.cron-job.org/';

// Your endpoints
const BASE_URL = 'https://hana-proxy-vercel-95h9zguqh-plturrells-projects.vercel.app';

// All remaining cron configurations
const ALL_CRON_CONFIGS = {
  // System Maintenance
  maintenance: [
    {
      title: 'System Health Check - Every 30 Minutes',
      url: `${BASE_URL}/api/system-maintenance?action=health-check`,
      schedule: { minutes: [0, 30], hours: [-1], wdays: [-1] },
      description: 'Comprehensive system health monitoring'
    },
    {
      title: 'Database Optimization - Daily',
      url: `${BASE_URL}/api/system-maintenance?action=optimize-database`,
      schedule: { minutes: [0], hours: [3], wdays: [-1] },
      description: 'Optimize database tables and indexes'
    },
    {
      title: 'Log Cleanup - Daily',
      url: `${BASE_URL}/api/system-maintenance?action=cleanup-logs`,
      schedule: { minutes: [0], hours: [2], wdays: [-1] },
      description: 'Clean up old logs and archive if needed'
    },
    {
      title: 'Storage Analysis - Daily',
      url: `${BASE_URL}/api/system-maintenance?action=analyze-storage`,
      schedule: { minutes: [0], hours: [1], wdays: [-1] },
      description: 'Analyze database storage usage'
    },
    {
      title: 'Maintenance Report - Daily',
      url: `${BASE_URL}/api/system-maintenance?action=maintenance-report`,
      schedule: { minutes: [0], hours: [7], wdays: [-1] },
      description: 'Generate daily maintenance report'
    }
  ],
  
  // Financial Intelligence
  intelligence: [
    {
      title: 'Sentiment Analysis - Every Hour',
      url: `${BASE_URL}/api/financial-intelligence?action=sentiment-analysis`,
      schedule: { minutes: [0], hours: [-1], wdays: [-1] },
      description: 'Analyze sentiment from recent news articles'
    },
    {
      title: 'Anomaly Detection - Every 15 Minutes',
      url: `${BASE_URL}/api/financial-intelligence?action=anomaly-detection`,
      schedule: { minutes: [0, 15, 30, 45], hours: [-1], wdays: [-1] },
      description: 'Detect market anomalies and unusual patterns'
    },
    {
      title: 'Correlation Analysis - Every 4 Hours',
      url: `${BASE_URL}/api/financial-intelligence?action=correlation-analysis`,
      schedule: { minutes: [0], hours: [0, 4, 8, 12, 16, 20], wdays: [-1] },
      description: 'Analyze asset correlations and relationships'
    },
    {
      title: 'Risk Signal Detection - Every 30 Minutes',
      url: `${BASE_URL}/api/financial-intelligence?action=risk-signals`,
      schedule: { minutes: [10, 40], hours: [-1], wdays: [-1] },
      description: 'Identify and analyze risk signals'
    },
    {
      title: 'Intelligence Report - Daily',
      url: `${BASE_URL}/api/financial-intelligence?action=intelligence-report`,
      schedule: { minutes: [0], hours: [18], wdays: [1, 2, 3, 4, 5] },
      description: 'Generate comprehensive intelligence report'
    }
  ],
  
  // Blockchain Monitoring
  blockchain: [
    {
      title: 'Blockchain Transaction Monitoring - Every 10 Minutes',
      url: `${BASE_URL}/api/blockchain-monitor?action=monitor-transactions`,
      schedule: { minutes: [0, 10, 20, 30, 40, 50], hours: [-1], wdays: [-1] },
      description: 'Monitor blockchain transactions'
    },
    {
      title: 'Smart Contract Monitoring - Every 30 Minutes',
      url: `${BASE_URL}/api/blockchain-monitor?action=monitor-contracts`,
      schedule: { minutes: [5, 35], hours: [-1], wdays: [-1] },
      description: 'Monitor smart contract status and events'
    },
    {
      title: 'Gas Price Analysis - Every Hour',
      url: `${BASE_URL}/api/blockchain-monitor?action=gas-analysis`,
      schedule: { minutes: [15], hours: [-1], wdays: [-1] },
      description: 'Analyze and predict gas prices'
    },
    {
      title: 'DeFi Protocol Monitoring - Every 2 Hours',
      url: `${BASE_URL}/api/blockchain-monitor?action=defi-monitoring`,
      schedule: { minutes: [0], hours: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22], wdays: [-1] },
      description: 'Monitor DeFi protocol health and TVL'
    },
    {
      title: 'Blockchain Health Check - Every 4 Hours',
      url: `${BASE_URL}/api/blockchain-monitor?action=blockchain-health`,
      schedule: { minutes: [0], hours: [0, 4, 8, 12, 16, 20], wdays: [-1] },
      description: 'Check blockchain network health'
    }
  ],
  
  // User Analytics
  analytics: [
    {
      title: 'User Pattern Analysis - Every 6 Hours',
      url: `${BASE_URL}/api/user-analytics?action=analyze-patterns`,
      schedule: { minutes: [0], hours: [0, 6, 12, 18], wdays: [-1] },
      description: 'Analyze user behavior patterns'
    },
    {
      title: 'Personalization Update - Daily',
      url: `${BASE_URL}/api/user-analytics?action=personalization-update`,
      schedule: { minutes: [0], hours: [4], wdays: [-1] },
      description: 'Update user personalization profiles'
    },
    {
      title: 'Engagement Metrics - Every 4 Hours',
      url: `${BASE_URL}/api/user-analytics?action=engagement-metrics`,
      schedule: { minutes: [30], hours: [0, 4, 8, 12, 16, 20], wdays: [-1] },
      description: 'Calculate user engagement metrics'
    },
    {
      title: 'Feature Usage Analysis - Daily',
      url: `${BASE_URL}/api/user-analytics?action=feature-usage`,
      schedule: { minutes: [0], hours: [5], wdays: [-1] },
      description: 'Analyze feature adoption and usage'
    },
    {
      title: 'Analytics Report - Weekly',
      url: `${BASE_URL}/api/user-analytics?action=analytics-report`,
      schedule: { minutes: [0], hours: [9], wdays: [1] }, // Monday 9 AM
      description: 'Generate comprehensive analytics report'
    }
  ]
};

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
      requestTimeout: 60,
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

async function listAllJobs() {
  try {
    const response = await fetch(`${CRONJOB_API_URL}jobs`, {
      headers: { 'Authorization': `Bearer ${CRONJOB_API_KEY}` }
    });
    const data = await response.json();
    
    console.log('\n📋 COMPLETE CRON JOB INVENTORY');
    console.log('='.repeat(50));
    console.log(`Total jobs: ${data.jobs.length}`);
    
    // Categorize jobs
    const categories = {
      'News & Market Data': [],
      'Agent Monitoring': [],
      'Portfolio Analytics': [],
      'System Maintenance': [],
      'Financial Intelligence': [],
      'Blockchain': [],
      'User Analytics': [],
      'Other': []
    };
    
    data.jobs.forEach(job => {
      let categorized = false;
      
      if (job.title.includes('News') || job.title.includes('Market Data')) {
        categories['News & Market Data'].push(job);
        categorized = true;
      }
      if (job.title.includes('Agent')) {
        categories['Agent Monitoring'].push(job);
        categorized = true;
      }
      if (job.title.includes('Portfolio')) {
        categories['Portfolio Analytics'].push(job);
        categorized = true;
      }
      if (job.title.includes('System') || job.title.includes('Maintenance')) {
        categories['System Maintenance'].push(job);
        categorized = true;
      }
      if (job.title.includes('Sentiment') || job.title.includes('Anomaly') || job.title.includes('Intelligence')) {
        categories['Financial Intelligence'].push(job);
        categorized = true;
      }
      if (job.title.includes('Blockchain') || job.title.includes('DeFi') || job.title.includes('Gas')) {
        categories['Blockchain'].push(job);
        categorized = true;
      }
      if (job.title.includes('User') || job.title.includes('Analytics') || job.title.includes('Engagement')) {
        categories['User Analytics'].push(job);
        categorized = true;
      }
      
      if (!categorized) {
        categories['Other'].push(job);
      }
    });
    
    // Display by category
    for (const [category, jobs] of Object.entries(categories)) {
      if (jobs.length > 0) {
        console.log(`\n${category} (${jobs.length} jobs):`);
        console.log('-'.repeat(40));
        jobs.forEach(job => {
          console.log(`• ${job.title}`);
          console.log(`  ID: ${job.jobId} | Status: ${job.enabled ? '✅ Active' : '❌ Disabled'}`);
          const nextRun = new Date(job.nextExecution * 1000);
          console.log(`  Next run: ${nextRun.toLocaleString()}`);
        });
      }
    }
    
    // Summary statistics
    console.log('\n📊 SUMMARY STATISTICS');
    console.log('='.repeat(50));
    console.log(`Active jobs: ${data.jobs.filter(j => j.enabled).length}`);
    console.log(`Disabled jobs: ${data.jobs.filter(j => !j.enabled).length}`);
    console.log(`Jobs by frequency:`);
    
    const frequencies = {};
    data.jobs.forEach(job => {
      const freq = getJobFrequency(job);
      frequencies[freq] = (frequencies[freq] || 0) + 1;
    });
    
    Object.entries(frequencies).forEach(([freq, count]) => {
      console.log(`  ${freq}: ${count} jobs`);
    });
    
  } catch (error) {
    console.error('Error listing jobs:', error.message);
  }
}

function getJobFrequency(job) {
  const schedule = job.schedule || {};
  
  if (schedule.minutes && schedule.minutes.length === 60) return 'Every minute';
  if (schedule.minutes && schedule.minutes.length === 12) return 'Every 5 minutes';
  if (schedule.minutes && schedule.minutes.length === 6) return 'Every 10 minutes';
  if (schedule.minutes && schedule.minutes.length === 4) return 'Every 15 minutes';
  if (schedule.minutes && schedule.minutes.length === 2) return 'Every 30 minutes';
  if (schedule.hours && schedule.hours.length === 24) return 'Hourly';
  if (schedule.hours && schedule.hours.length === 12) return 'Every 2 hours';
  if (schedule.hours && schedule.hours.length === 6) return 'Every 4 hours';
  if (schedule.hours && schedule.hours.length === 1) return 'Daily';
  if (schedule.wdays && schedule.wdays.length === 1) return 'Weekly';
  
  return 'Custom schedule';
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create-all':
      console.log('🎯 CREATING ALL REMAINING AUTOMATION');
      console.log('This will set up:');
      console.log('- System Maintenance (5 jobs)');
      console.log('- Financial Intelligence (5 jobs)');
      console.log('- Blockchain Monitoring (5 jobs)');
      console.log('- User Analytics (5 jobs)');
      console.log('\nTotal: 20 new cron jobs');
      
      const allResults = {};
      
      for (const [category, configs] of Object.entries(ALL_CRON_CONFIGS)) {
        allResults[category] = await setupCronJobs(configs, category.toUpperCase() + ' CRONS');
      }
      
      console.log('\n🎉 COMPLETE AUTOMATION ACHIEVED!');
      console.log('='.repeat(50));
      
      let totalCreated = 0;
      for (const [category, results] of Object.entries(allResults)) {
        console.log(`${category}: ${results.length} jobs created`);
        totalCreated += results.length;
      }
      
      console.log(`\nTotal jobs created: ${totalCreated}`);
      console.log('\n✨ Your financial intelligence system is now FULLY AUTOMATED!');
      break;
      
    case 'create-maintenance':
      await setupCronJobs(ALL_CRON_CONFIGS.maintenance, 'SYSTEM MAINTENANCE CRONS');
      break;
      
    case 'create-intelligence':
      await setupCronJobs(ALL_CRON_CONFIGS.intelligence, 'FINANCIAL INTELLIGENCE CRONS');
      break;
      
    case 'create-blockchain':
      await setupCronJobs(ALL_CRON_CONFIGS.blockchain, 'BLOCKCHAIN MONITORING CRONS');
      break;
      
    case 'create-analytics':
      await setupCronJobs(ALL_CRON_CONFIGS.analytics, 'USER ANALYTICS CRONS');
      break;
      
    case 'list':
      await listAllJobs();
      break;
      
    case 'test':
      console.log('🧪 TESTING ALL ENDPOINTS');
      console.log('='.repeat(50));
      
      const endpoints = [
        { name: 'System Maintenance', url: '/api/system-maintenance?action=status' },
        { name: 'Financial Intelligence', url: '/api/financial-intelligence?action=status' },
        { name: 'Blockchain Monitor', url: '/api/blockchain-monitor?action=status' },
        { name: 'User Analytics', url: '/api/user-analytics?action=status' }
      ];
      
      for (const endpoint of endpoints) {
        console.log(`\nTesting ${endpoint.name}...`);
        try {
          const response = await fetch(`${BASE_URL}${endpoint.url}`);
          const data = await response.json();
          console.log(`${endpoint.name}: ${response.ok ? '✅ Working' : '❌ Failed'}`);
          if (data.message) console.log(`   ${data.message}`);
        } catch (error) {
          console.log(`❌ ${endpoint.name} Error:`, error.message);
        }
      }
      break;
      
    default:
      console.log('🚀 Complete System Automation Setup');
      console.log('='.repeat(50));
      console.log('\nCommands:');
      console.log('  test                 - Test all endpoints');
      console.log('  create-all           - Create ALL remaining cron jobs');
      console.log('  create-maintenance   - Create maintenance jobs only');
      console.log('  create-intelligence  - Create intelligence jobs only');
      console.log('  create-blockchain    - Create blockchain jobs only');
      console.log('  create-analytics     - Create analytics jobs only');
      console.log('  list                 - List all existing cron jobs');
      console.log('\nExample:');
      console.log('  node setup-all-remaining-crons.js create-all');
      console.log('\nNOTE: Remember to create the database tables first!');
  }
}

// Run
main().catch(console.error);