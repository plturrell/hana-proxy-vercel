import fetch from 'node-fetch';

async function monitorNextCron() {
  console.log('⏰ MONITORING NEXT CRON EXECUTION');
  console.log('='.repeat(35));
  
  const now = new Date();
  const currentMinute = now.getMinutes();
  const nextCronMinute = Math.ceil(currentMinute / 5) * 5;
  const minutesUntilNext = nextCronMinute - currentMinute;
  
  console.log(`\nCurrent time: ${now.toLocaleTimeString()}`);
  console.log(`Next cron at: :${nextCronMinute.toString().padStart(2, '0')}`);
  console.log(`Time until next execution: ${minutesUntilNext} minute(s)`);
  
  // Get baseline status
  console.log('\n📊 Current system status:');
  try {
    const response = await fetch('https://hana-proxy-vercel-6nazdq6cc-plturrells-projects.vercel.app/api/news-realtime?action=status');
    const beforeStatus = await response.json();
    
    console.log(`Articles in last hour: ${beforeStatus.articlesInLastHour}`);
    console.log(`Last processed: ${beforeStatus.lastProcessed || 'Never'}`);
    console.log(`Tables status: ${JSON.stringify(beforeStatus.tableStats)}`);
    
    // If we're very close to the next cron, wait and check
    if (minutesUntilNext <= 1) {
      console.log('\n⏳ Very close to next execution - waiting 2 minutes...');
      await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes
      
      console.log('\n🔍 Checking after cron should have run...');
      const afterResponse = await fetch('https://hana-proxy-vercel-6nazdq6cc-plturrells-projects.vercel.app/api/news-realtime?action=status');
      const afterStatus = await afterResponse.json();
      
      console.log('\n📈 RESULTS:');
      console.log(`Before: ${beforeStatus.articlesInLastHour} articles`);
      console.log(`After: ${afterStatus.articlesInLastHour} articles`);
      console.log(`Last processed: ${afterStatus.lastProcessed || 'Still null'}`);
      
      if (afterStatus.lastProcessed && !beforeStatus.lastProcessed) {
        console.log('✅ SUCCESS! Cron job executed successfully');
      } else if (afterStatus.articlesInLastHour > beforeStatus.articlesInLastHour) {
        console.log('✅ SUCCESS! New articles were processed');
      } else {
        console.log('❌ No processing detected - cron may not be working');
      }
    } else {
      console.log(`\n⏳ Too long to wait (${minutesUntilNext} minutes)`);
      console.log('💡 Check back at the next 5-minute mark');
      console.log('📋 Or monitor: curl "https://hana-proxy-vercel-6nazdq6cc-plturrells-projects.vercel.app/api/news-realtime?action=status" | jq .lastProcessed');
    }
    
  } catch (error) {
    console.error('Error checking status:', error.message);
  }
  
  console.log('\n🔍 MANUAL TEST RECOMMENDATION:');
  console.log('Run this to manually trigger processing:');
  console.log('curl "https://hana-proxy-vercel-6nazdq6cc-plturrells-projects.vercel.app/api/news-realtime?action=fetch"');
}

monitorNextCron();