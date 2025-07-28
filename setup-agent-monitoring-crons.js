#!/usr/bin/env node

import fetch from 'node-fetch';

// Cron-job.org API configuration
const CRONJOB_API_KEY = '2HAna8iFwTHdWDReesbyqNUX9GIa9gg732GINNVNTk4=';
const CRONJOB_API_URL = 'https://api.cron-job.org/';

// Your agent monitoring endpoint
const BASE_URL = 'https://hana-proxy-vercel-95h9zguqh-plturrells-projects.vercel.app';

// Agent monitoring cron configurations
const CRON_CONFIGS = [
  {
    title: 'Agent Health Check - Every 5 Minutes',
    url: `${BASE_URL}/api/agent-health-monitor?action=monitor`,
    schedule: {
      // Every 5 minutes
      minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
      hours: [-1], // All hours
      wdays: [-1]  // All days
    },
    description: 'Monitor health status of all 8 agents'
  },
  {
    title: 'Agent Performance Metrics - Hourly',
    url: `${BASE_URL}/api/agent-health-monitor?action=metrics&period=1h`,
    schedule: {
      // Every hour at minute 2
      minutes: [2],
      hours: [-1],
      wdays: [-1]
    },
    description: 'Collect and aggregate agent performance metrics'
  },
  {
    title: 'Agent Alert Check - Every 15 Minutes',
    url: `${BASE_URL}/api/agent-health-monitor?action=alerts`,
    schedule: {
      // Every 15 minutes
      minutes: [0, 15, 30, 45],
      hours: [-1],
      wdays: [-1]
    },
    description: 'Check for unresolved alerts and escalate if needed'
  },
  {
    title: 'Agent Health History - Daily Report',
    url: `${BASE_URL}/api/agent-health-monitor?action=history&hours=24`,
    schedule: {
      // Once daily at 8 AM EST
      minutes: [0],
      hours: [8],
      wdays: [-1]
    },
    description: 'Generate daily health report for all agents'
  },
  {
    title: 'Critical Agent Check - Every 2 Minutes',
    url: `${BASE_URL}/api/agent-health-monitor?action=monitor&critical=true`,
    schedule: {
      // Every 2 minutes for critical agents only
      minutes: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58],
      hours: [-1],
      wdays: [-1]
    },
    description: 'High-frequency monitoring of critical agents (News Intelligence, Market Data, API Gateway, Orchestrator)'
  }
];

// Portfolio analytics configurations
const PORTFOLIO_CRON_CONFIGS = [
  {
    title: 'Portfolio Valuation Update - Market Hours',
    url: `${BASE_URL}/api/portfolio-analytics?action=update-valuations`,
    schedule: {
      // Every 10 minutes during market hours
      minutes: [0, 10, 20, 30, 40, 50],
      hours: [9, 10, 11, 12, 13, 14, 15, 16],
      wdays: [1, 2, 3, 4, 5] // Weekdays only
    },
    description: 'Update portfolio valuations during market hours'
  },
  {
    title: 'Portfolio Risk Metrics - Every 30 Minutes',
    url: `${BASE_URL}/api/portfolio-analytics?action=calculate-risk`,
    schedule: {
      // Every 30 minutes
      minutes: [0, 30],
      hours: [-1],
      wdays: [-1]
    },
    description: 'Calculate VaR, Sharpe ratio, and other risk metrics'
  },
  {
    title: 'Portfolio Optimization Suggestions - Daily',
    url: `${BASE_URL}/api/portfolio-analytics?action=optimize`,
    schedule: {
      // Once daily at 6 AM EST
      minutes: [0],
      hours: [6],
      wdays: [-1]
    },
    description: 'Generate portfolio optimization and rebalancing suggestions'
  },
  {
    title: 'Portfolio Performance Report - EOD',
    url: `${BASE_URL}/api/portfolio-analytics?action=daily-report`,
    schedule: {
      // End of day at 5 PM EST
      minutes: [0],
      hours: [17],
      wdays: [1, 2, 3, 4, 5]
    },
    description: 'Generate end-of-day portfolio performance report'
  }
];

// GraphQL cache warming configurations
const GRAPHQL_CRON_CONFIGS = [
  {
    title: 'GraphQL Cache Warming - Popular Queries',
    url: `${BASE_URL}/api/graphql-cache-warmer?action=warm-popular`,
    schedule: {
      // Every 15 minutes
      minutes: [0, 15, 30, 45],
      hours: [-1],
      wdays: [-1]
    },
    description: 'Pre-cache frequently requested GraphQL queries'
  },
  {
    title: 'GraphQL Schema Sync - Hourly',
    url: `${BASE_URL}/api/graphql-cache-warmer?action=sync-schema`,
    schedule: {
      // Every hour at minute 5
      minutes: [5],
      hours: [-1],
      wdays: [-1]
    },
    description: 'Synchronize GraphQL schema with database changes'
  },
  {
    title: 'GraphQL Performance Analysis - Daily',
    url: `${BASE_URL}/api/graphql-cache-warmer?action=analyze-performance`,
    schedule: {
      // Once daily at 3 AM EST
      minutes: [0],
      hours: [3],
      wdays: [-1]
    },
    description: 'Analyze GraphQL query performance and optimize slow queries'
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
  
  // Test agent health monitor
  console.log('\n1. Testing Agent Health Monitor...');
  try {
    const response = await fetch(`${BASE_URL}/api/agent-health-monitor?action=health`);
    const data = await response.json();
    console.log('Agent Health Monitor:', response.ok ? '✅ Working' : '❌ Failed');
    if (data.error) console.log('Error:', data.error);
  } catch (error) {
    console.log('❌ Agent Health Monitor Error:', error.message);
  }
  
  // Test portfolio analytics (if exists)
  console.log('\n2. Testing Portfolio Analytics...');
  try {
    const response = await fetch(`${BASE_URL}/api/portfolio-analytics?action=health`);
    console.log('Portfolio Analytics:', response.ok ? '✅ Working' : '⚠️ Not implemented yet');
  } catch (error) {
    console.log('⚠️ Portfolio Analytics not available yet');
  }
  
  // Test GraphQL cache warmer (if exists)
  console.log('\n3. Testing GraphQL Cache Warmer...');
  try {
    const response = await fetch(`${BASE_URL}/api/graphql-cache-warmer?action=health`);
    console.log('GraphQL Cache Warmer:', response.ok ? '✅ Working' : '⚠️ Not implemented yet');
  } catch (error) {
    console.log('⚠️ GraphQL Cache Warmer not available yet');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create-all':
      const agentResults = await setupCronJobs(CRON_CONFIGS, 'AGENT MONITORING CRONS');
      const portfolioResults = await setupCronJobs(PORTFOLIO_CRON_CONFIGS, 'PORTFOLIO ANALYTICS CRONS');
      const graphqlResults = await setupCronJobs(GRAPHQL_CRON_CONFIGS, 'GRAPHQL CACHE WARMING CRONS');
      
      console.log('\n📋 OVERALL SUMMARY:');
      console.log('='.repeat(50));
      console.log(`Agent Monitoring Jobs: ${agentResults.length}`);
      console.log(`Portfolio Analytics Jobs: ${portfolioResults.length}`);
      console.log(`GraphQL Cache Jobs: ${graphqlResults.length}`);
      console.log(`Total Jobs Created: ${agentResults.length + portfolioResults.length + graphqlResults.length}`);
      break;
      
    case 'create-agents':
      await setupCronJobs(CRON_CONFIGS, 'AGENT MONITORING CRONS');
      break;
      
    case 'create-portfolio':
      await setupCronJobs(PORTFOLIO_CRON_CONFIGS, 'PORTFOLIO ANALYTICS CRONS');
      break;
      
    case 'create-graphql':
      await setupCronJobs(GRAPHQL_CRON_CONFIGS, 'GRAPHQL CACHE WARMING CRONS');
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
      console.log('🤖 Agent & System Monitoring Setup');
      console.log('='.repeat(40));
      console.log('\nCommands:');
      console.log('  test            - Test all endpoints');
      console.log('  create-all      - Create all monitoring cron jobs');
      console.log('  create-agents   - Create agent monitoring jobs only');
      console.log('  create-portfolio - Create portfolio analytics jobs only');
      console.log('  create-graphql  - Create GraphQL cache jobs only');
      console.log('  list            - List all existing cron jobs');
      console.log('\nExample:');
      console.log('  node setup-agent-monitoring-crons.js test');
      console.log('  node setup-agent-monitoring-crons.js create-agents');
      console.log('\nNOTE: Create database tables first!');
      console.log('Run the SQL in create-agent-monitoring-tables.sql');
  }
}

// Run
main().catch(console.error);