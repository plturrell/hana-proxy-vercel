import fetch from 'node-fetch';

async function debugCronStatus() {
  console.log('🔍 DEBUGGING CRON STATUS');
  console.log('='.repeat(30));
  
  const now = new Date();
  console.log(`\nCurrent time: ${now.toISOString()}`);
  console.log(`Minutes: ${now.getMinutes()}`);
  console.log(`Should have run at: :${now.getMinutes() - (now.getMinutes() % 5)}0`);
  
  // Check if we just passed a 5-minute mark
  const minutesSinceLastCron = now.getMinutes() % 5;
  console.log(`Time since last cron slot: ${minutesSinceLastCron} minute(s)`);
  
  if (minutesSinceLastCron <= 1) {
    console.log('✅ Cron should have just executed!');
  } else {
    console.log(`⏳ Next cron in: ${5 - minutesSinceLastCron} minute(s)`);
  }
  
  // Test API with simpler call
  console.log('\n📡 Testing API endpoint directly...');
  try {
    const response = await fetch('https://hana-proxy-vercel-6nazdq6cc-plturrells-projects.vercel.app/api/news-realtime?action=status');
    const data = await response.json();
    
    console.log('Status response received:', {
      status: data.status,
      lastProcessed: data.lastProcessed,
      perplexityEnabled: data.perplexityEnabled,
      automationEnabled: data.automationEnabled
    });
    
    if (data.lastProcessed) {
      const lastRun = new Date(data.lastProcessed);
      const minutesAgo = Math.round((now - lastRun) / (1000 * 60));
      console.log(`Last processing: ${minutesAgo} minutes ago`);
    } else {
      console.log('❌ No processing has occurred yet');
    }
    
  } catch (error) {
    console.error('API test failed:', error.message);
  }
  
  console.log('\n🎯 DIAGNOSIS:');
  if (minutesSinceLastCron <= 1) {
    console.log('1. ✅ Cron timing is correct');
    console.log('2. ❌ But no processing occurred - likely API issue');
    console.log('3. 💡 Need to fix Perplexity API integration');
  } else {
    console.log('1. ⏳ Waiting for next cron execution');
    console.log('2. 🔍 Monitor at the next 5-minute mark');
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Fix Perplexity API integration');
  console.log('2. Test manual trigger');
  console.log('3. Wait for next automated execution');
  console.log('4. Check Vercel function logs for errors');
}

debugCronStatus();