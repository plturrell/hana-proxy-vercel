import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCronLogs() {
  console.log('🔍 CHECKING CRON JOB EXECUTION LOGS');
  console.log('='.repeat(40));
  
  const now = new Date();
  console.log(`Current time: ${now.toLocaleString()}`);
  console.log(`Should run every 5 minutes at: :00, :05, :10, :15, :20, :25, :30, :35, :40, :45, :50, :55`);
  
  // Get processing logs from last 24 hours
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: logs, error } = await supabase
    .from('news_loading_status_log')
    .select('*')
    .gte('created_at', oneDayAgo)
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }
  
  console.log(`\nFound ${logs.length} processing logs in last 24 hours:`);
  console.log('-'.repeat(80));
  
  logs.forEach((log, index) => {
    const time = new Date(log.created_at);
    const minutes = time.getMinutes();
    const isOnSchedule = minutes % 5 === 0 || minutes % 5 === 1; // Allow 1 minute delay
    
    console.log(`${index + 1}. ${time.toLocaleString()} ${isOnSchedule ? '✅' : '⚠️'}`);
    console.log(`   Fetched: ${log.articles_fetched}, Processed: ${log.articles_processed}, Success Rate: ${log.success_rate}%`);
    console.log(`   Source: ${log.source}, Health: ${log.health_status}`);
  });
  
  // Calculate cron reliability
  const expectedRuns = Math.floor((now - new Date(oneDayAgo)) / (5 * 60 * 1000));
  const actualRuns = logs.length;
  const reliability = ((actualRuns / expectedRuns) * 100).toFixed(1);
  
  console.log('\n📊 CRON JOB STATISTICS:');
  console.log(`Expected runs in 24h: ${expectedRuns}`);
  console.log(`Actual runs: ${actualRuns}`);
  console.log(`Reliability: ${reliability}%`);
  
  // Check for gaps
  if (logs.length > 1) {
    console.log('\n⏱️ TIME GAPS ANALYSIS:');
    for (let i = 0; i < logs.length - 1; i++) {
      const current = new Date(logs[i].created_at);
      const next = new Date(logs[i + 1].created_at);
      const gapMinutes = Math.round((current - next) / 60000);
      
      if (gapMinutes > 10) {
        console.log(`❌ ${gapMinutes} minute gap between ${next.toLocaleTimeString()} and ${current.toLocaleTimeString()}`);
      }
    }
  }
  
  // Last run details
  if (logs.length > 0) {
    const lastRun = new Date(logs[0].created_at);
    const minutesSinceLastRun = Math.round((now - lastRun) / 60000);
    
    console.log('\n🕐 LAST RUN:');
    console.log(`Time: ${lastRun.toLocaleString()}`);
    console.log(`${minutesSinceLastRun} minutes ago`);
    
    if (minutesSinceLastRun > 10) {
      console.log('⚠️ WARNING: Cron job appears to have stopped!');
      console.log('Expected to run every 5 minutes but hasn\'t run in over 10 minutes.');
    }
  }
}

checkCronLogs();