#!/usr/bin/env node

import fetch from 'node-fetch';

// Cron-job.org API configuration
const CRONJOB_API_KEY = '2HAna8iFwTHdWDReesbyqNUX9GIa9gg732GINNVNTk4=';
const CRONJOB_API_URL = 'https://api.cron-job.org/';

// Your news extraction endpoint
const NEWS_ENDPOINT = 'https://hana-proxy-vercel-9hxhhmdqe-plturrells-projects.vercel.app/api/news-realtime?action=fetch';

async function createCronJob() {
  console.log('🕐 Setting up Cron Job via API...');
  console.log('='.repeat(50));
  
  const cronJobData = {
    job: {
      url: NEWS_ENDPOINT,
      enabled: true,
      title: 'News Intelligence Agent - Perplexity Fetch',
      saveResponses: true,
      schedule: {
        timezone: 'UTC',
        hours: [-1],  // Every hour
        mdays: [-1],  // Every day
        minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], // Every 5 minutes
        months: [-1], // Every month
        wdays: [-1]   // Every weekday
      },
      requestTimeout: 30,
      redirectSuccess: true,
      requestMethod: 0, // 0 = GET
      notifyFailure: true,
      notifySuccess: false,
      notifyDisable: false,
      auth: {
        enable: false
      },
      notification: {
        onFailure: true,
        onSuccess: false,
        onDisable: false
      },
      extendedData: {
        headers: {
          'User-Agent': 'CronJob/1.0 (News Intelligence Agent)'
        }
      }
    }
  };

  try {
    // Create the cron job
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
    
    console.log('✅ Cron job created successfully!');
    console.log('\n📋 Job Details:');
    console.log(`ID: ${result.jobId}`);
    console.log(`Title: ${cronJobData.job.title}`);
    console.log(`URL: ${cronJobData.job.url}`);
    console.log(`Schedule: Every 5 minutes`);
    console.log(`Status: ${cronJobData.job.enabled ? 'Enabled' : 'Disabled'}`);
    
    // Test the job
    await testCronJob(result.jobId);
    
    // Get job status
    await getJobStatus(result.jobId);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error creating cron job:', error.message);
    
    // Try to list existing jobs to see if we need different permissions
    console.log('\n📋 Attempting to list existing jobs...');
    await listExistingJobs();
  }
}

async function testCronJob(jobId) {
  console.log('\n🧪 Testing cron job...');
  
  try {
    const response = await fetch(`${CRONJOB_API_URL}jobs/${jobId}/test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRONJOB_API_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Test run initiated successfully');
    } else {
      console.log('⚠️ Test run failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing job:', error.message);
  }
}

async function getJobStatus(jobId) {
  console.log('\n📊 Getting job status...');
  
  try {
    const response = await fetch(`${CRONJOB_API_URL}jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRONJOB_API_KEY}`
      }
    });
    
    if (response.ok) {
      const job = await response.json();
      console.log('Job status:', job.job?.enabled ? 'Active' : 'Inactive');
      console.log('Next run:', job.job?.nextExecution || 'Unknown');
    }
  } catch (error) {
    console.error('❌ Error getting job status:', error.message);
  }
}

async function listExistingJobs() {
  try {
    const response = await fetch(`${CRONJOB_API_URL}jobs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRONJOB_API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`\n📋 Found ${data.jobs?.length || 0} existing jobs:`);
      
      if (data.jobs && data.jobs.length > 0) {
        data.jobs.forEach((job, index) => {
          console.log(`\n${index + 1}. ${job.title || 'Untitled'}`);
          console.log(`   URL: ${job.url}`);
          console.log(`   Status: ${job.enabled ? 'Enabled' : 'Disabled'}`);
          console.log(`   Job ID: ${job.jobId}`);
        });
      }
    } else {
      console.log('Could not list jobs:', response.status);
    }
  } catch (error) {
    console.error('Error listing jobs:', error.message);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      await createCronJob();
      break;
      
    case 'list':
      await listExistingJobs();
      break;
      
    case 'test':
      if (args[1]) {
        await testCronJob(args[1]);
      } else {
        console.log('Usage: node setup-cronjob-api.js test <jobId>');
      }
      break;
      
    case 'status':
      if (args[1]) {
        await getJobStatus(args[1]);
      } else {
        console.log('Usage: node setup-cronjob-api.js status <jobId>');
      }
      break;
      
    default:
      console.log('🕐 Cron-job.org API CLI');
      console.log('='.repeat(30));
      console.log('\nCommands:');
      console.log('  create         - Create new cron job for news extraction');
      console.log('  list           - List all existing cron jobs');
      console.log('  test <jobId>   - Test run a specific job');
      console.log('  status <jobId> - Get status of a specific job');
      console.log('\nExample:');
      console.log('  node setup-cronjob-api.js create');
      console.log('  node setup-cronjob-api.js list');
  }
}

// Alternative: Direct cURL command generator
function generateCurlCommand() {
  console.log('\n📋 Alternative: Use this cURL command directly:\n');
  
  const curlCommand = `curl -X PUT https://api.cron-job.org/jobs \\
  -H "Authorization: Bearer ${CRONJOB_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "job": {
      "url": "${NEWS_ENDPOINT}",
      "enabled": true,
      "title": "News Intelligence Agent - Perplexity Fetch",
      "schedule": {
        "timezone": "UTC",
        "hours": [-1],
        "mdays": [-1],
        "minutes": [0,5,10,15,20,25,30,35,40,45,50,55],
        "months": [-1],
        "wdays": [-1]
      },
      "requestTimeout": 30,
      "requestMethod": 0
    }
  }'`;
  
  console.log(curlCommand);
}

// Run the CLI
main().catch(console.error);

// Also show the curl command for reference
if (process.argv.includes('--curl')) {
  generateCurlCommand();
}