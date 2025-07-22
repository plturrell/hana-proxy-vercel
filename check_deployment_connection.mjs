import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeploymentConnection() {
  console.log('🔍 CHECKING DEPLOYMENT CONNECTION');
  console.log('='.repeat(40));
  
  // Check local database
  console.log('\n📊 Local Database Check:');
  const { count: localCount } = await supabase
    .from('news_articles_partitioned')
    .select('*', { count: 'exact', head: true });
  
  console.log(`news_articles_partitioned: ${localCount} rows`);
  
  // Test manual fetch trigger
  console.log('\n📰 Testing Manual Fetch Trigger...');
  try {
    const response = await fetch('https://hana-proxy-vercel-fh2e2xvbh-plturrells-projects.vercel.app/api/news-realtime?action=fetch');
    const result = await response.json();
    
    console.log('Fetch Response:', JSON.stringify(result, null, 2));
    
    if (result.error) {
      console.log('\n❌ Error:', result.error);
      console.log('Details:', result.details);
    } else if (result.success) {
      console.log('\n✅ Success!');
      console.log(`Articles found: ${result.articlesFound}`);
      console.log(`Articles processed: ${result.articlesProcessed}`);
    }
  } catch (error) {
    console.error('❌ Failed to fetch:', error.message);
  }
  
  // Check cron status
  console.log('\n⏰ Cron Job Status:');
  console.log('The cron job is configured to run every 5 minutes');
  console.log('Next execution times:', new Date().getMinutes() % 5 === 0 ? 'NOW' : `in ${5 - (new Date().getMinutes() % 5)} minutes`);
  
  console.log('\n📋 Monitor at:');
  console.log('1. Vercel Functions: https://vercel.com/plturrells-projects/hana-proxy-vercel/functions');
  console.log('2. Supabase Tables: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/database/tables');
  console.log('3. Status Endpoint: https://hana-proxy-vercel-fh2e2xvbh-plturrells-projects.vercel.app/api/news-realtime?action=status');
}

checkDeploymentConnection();