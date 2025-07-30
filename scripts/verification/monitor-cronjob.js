#!/usr/bin/env node

import fetch from 'node-fetch';

const CRONJOB_API_KEY = '2HAna8iFwTHdWDReesbyqNUX9GIa9gg732GINNVNTk4=';
const CRONJOB_API_URL = 'https://api.cron-job.org/';
const NEWS_STATUS_URL = 'https://hana-proxy-vercel-9hxhhmdqe-plturrells-projects.vercel.app/api/news-realtime?action=status';

async function monitorCronJob() {
  console.log('📊 CRON JOB MONITORING');
  console.log('='.repeat(50));
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // Get cron job status
    const cronResponse = await fetch(`${CRONJOB_API_URL}jobs`, {
      headers: {
        'Authorization': `Bearer ${CRONJOB_API_KEY}`
      }
    });
    
    if (cronResponse.ok) {
      const data = await cronResponse.json();
      const job = data.jobs[0];
      
      console.log('🕐 CRON JOB STATUS:');
      console.log(`Job ID: ${job.jobId}`);
      console.log(`Status: ${job.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`Last Status: ${job.lastStatus === 1 ? '✅ Success' : job.lastStatus === 0 ? '⏳ Not run yet' : '❌ Failed'}`);
      console.log(`Last Duration: ${job.lastDuration}ms`);
      
      if (job.lastExecution > 0) {
        const lastRun = new Date(job.lastExecution * 1000);
        console.log(`Last Run: ${lastRun.toLocaleString()}`);
      }
      
      const nextRun = new Date(job.nextExecution * 1000);
      console.log(`Next Run: ${nextRun.toLocaleString()}`);
      const minutesUntilNext = Math.round((nextRun - new Date()) / 60000);
      console.log(`Time until next: ${minutesUntilNext} minutes`);
    }
    
    // Get news processing status
    console.log('\n📰 NEWS PROCESSING STATUS:');
    const newsResponse = await fetch(NEWS_STATUS_URL);
    
    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      console.log(`Articles collected: ${newsData.tableStats.news_articles_partitioned}`);
      console.log(`Articles in last hour: ${newsData.articlesInLastHour}`);
      console.log(`Last processed: ${new Date(newsData.lastProcessed).toLocaleString()}`);
      console.log(`Entity extractions: ${newsData.tableStats.news_entity_extractions}`);
      console.log(`Breaking alerts: ${newsData.tableStats.breaking_news_alerts}`);
    }
    
    // Get recent execution history
    console.log('\n📅 RECENT EXECUTIONS:');
    const historyResponse = await fetch(`${CRONJOB_API_URL}jobs/6377578/history?count=10`, {
      headers: {
        'Authorization': `Bearer ${CRONJOB_API_KEY}`
      }
    });
    
    if (historyResponse.ok) {
      const history = await historyResponse.json();
      if (history.history && history.history.length > 0) {
        history.history.slice(0, 5).forEach((exec, index) => {
          const time = new Date(exec.startTime * 1000);
          const status = exec.status === 1 ? '✅' : '❌';
          console.log(`${index + 1}. ${time.toLocaleString()} ${status} (${exec.duration}ms)`);
        });
      } else {
        console.log('No execution history yet');
      }
    }
    
  } catch (error) {
    console.error('Error monitoring:', error.message);
  }
}

// Run monitoring
monitorCronJob();

// If --watch flag is provided, monitor continuously
if (process.argv.includes('--watch')) {
  console.log('\n👁️ Monitoring every minute... (Ctrl+C to stop)');
  setInterval(monitorCronJob, 60000);
}