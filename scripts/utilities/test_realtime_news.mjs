import fetch from 'node-fetch';

async function testRealtimeNewsEndpoint() {
  console.log('🚀 TESTING REAL-TIME NEWS ENDPOINT');
  console.log('='.repeat(40));

  const baseUrl = 'http://localhost:3000'; // Update if deployed

  try {
    // 1. Test status endpoint
    console.log('\n📊 1. Testing Status Endpoint...');
    const statusResponse = await fetch(`${baseUrl}/api/news-realtime?action=status`);
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Status Response:', JSON.stringify(status, null, 2));
    } else {
      console.log('❌ Status endpoint not available');
    }

    // 2. Test fetch endpoint (this will use Perplexity API)
    console.log('\n📰 2. Testing Fetch Latest News...');
    const fetchResponse = await fetch(`${baseUrl}/api/news-realtime?action=fetch`);
    
    if (fetchResponse.ok) {
      const result = await fetchResponse.json();
      console.log('✅ Fetch Response:');
      console.log(`   Articles found: ${result.articlesFound || 0}`);
      console.log(`   Articles processed: ${result.articlesProcessed || 0}`);
      
      if (result.articles && result.articles.length > 0) {
        console.log('\n📋 Sample Article:');
        const sample = result.articles[0];
        console.log(`   Title: ${sample.title}`);
        console.log(`   Source: ${sample.source}`);
        console.log(`   Sentiment: ${sample.sentiment} (${sample.sentiment_score})`);
        console.log(`   Market Impact: ${sample.market_impact} (${sample.market_impact_score})`);
      }
    } else {
      console.log('❌ Fetch endpoint not available');
    }

    // 3. Test scheduling information
    console.log('\n⏰ 3. Getting Scheduling Information...');
    const scheduleResponse = await fetch(`${baseUrl}/api/news-realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'schedule' })
    });
    
    if (scheduleResponse.ok) {
      const schedule = await scheduleResponse.json();
      console.log('✅ Scheduling Info:', JSON.stringify(schedule, null, 2));
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    console.log('\n📋 To test locally:');
    console.log('1. Run: vercel dev');
    console.log('2. Make sure environment variables are set');
    console.log('3. Try again with the local URL');
  }

  console.log('\n🎯 DEPLOYMENT INSTRUCTIONS:');
  console.log('-'.repeat(30));
  console.log('1. Deploy to Vercel: vercel --prod');
  console.log('2. Set environment variables in Vercel dashboard:');
  console.log('   - SUPABASE_URL');
  console.log('   - SUPABASE_SERVICE_KEY');
  console.log('   - PERPLEXITY_API_KEY');
  console.log('3. The cron job will automatically run every 5 minutes');
  console.log('4. Monitor at: https://vercel.com/dashboard/[project]/functions');
}

testRealtimeNewsEndpoint();