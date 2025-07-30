/**
 * Monitor deployment status
 */

import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

const endpoints = [
  { name: 'knowledge-docs', url: 'https://hana-proxy-vercel.vercel.app/api/knowledge-docs' },
  { name: 'test-page', url: 'https://hana-proxy-vercel.vercel.app/test-knowledge-manual.html' },
  { name: 'teach-interface', url: 'https://hana-proxy-vercel.vercel.app/teach-jobs.html' }
];

async function checkEndpoint(endpoint) {
  try {
    const response = await fetch(endpoint.url);
    const status = response.status;
    
    if (endpoint.name === 'knowledge-docs' && status === 200) {
      const data = await response.json();
      console.log(`✅ ${endpoint.name}: ${status} - Documents: ${data.documents?.length || 0}`);
      return true;
    } else if (status === 200) {
      console.log(`✅ ${endpoint.name}: ${status} OK`);
      return true;
    } else {
      console.log(`❌ ${endpoint.name}: ${status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint.name}: ${error.message}`);
    return false;
  }
}

async function monitorDeployment() {
  console.log('🔍 Monitoring Vercel Deployment\n' + '='.repeat(40));
  
  let attempts = 0;
  const maxAttempts = 20; // 10 minutes max
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\nAttempt ${attempts}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
    
    let allWorking = true;
    for (const endpoint of endpoints) {
      const working = await checkEndpoint(endpoint);
      if (!working && endpoint.name === 'knowledge-docs') {
        allWorking = false;
      }
    }
    
    if (allWorking) {
      console.log('\n🎉 Deployment successful! Knowledge Base is ready.');
      console.log('📍 Access at: https://hana-proxy-vercel.vercel.app/teach-jobs.html');
      return;
    }
    
    if (attempts < maxAttempts) {
      console.log('\nWaiting 30 seconds...');
      await setTimeout(30000);
    }
  }
  
  console.log('\n⏱️ Monitoring timeout - deployment may still be in progress');
}

monitorDeployment().catch(console.error);