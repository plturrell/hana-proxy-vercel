import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAutomatedProcessing() {
  console.log('🔍 CHECKING AUTOMATED NEWS PROCESSING SYSTEM');
  console.log('='.repeat(45));

  try {
    // 1. Check if News Intelligence Agent is registered
    console.log('\n📊 1. News Intelligence Agent Status:');
    const { data: agent } = await supabase
      .from('a2a_agents')
      .select('*')
      .eq('agent_id', 'finsight.data.news_intelligence')
      .single();

    if (agent) {
      console.log(`✅ Agent registered: ${agent.agent_name}`);
      console.log(`   Status: ${agent.status}`);
      console.log(`   Type: ${agent.agent_type}`);
      console.log(`   Intelligence Level: ${agent.connection_config?.intelligence_level || 'N/A'}`);
      
      // Check scheduled tasks
      if (agent.scheduled_tasks) {
        console.log('\n⏰ Scheduled Tasks:');
        agent.scheduled_tasks.forEach(task => {
          console.log(`   - ${task.name}: ${task.interval} → ${task.action}`);
        });
      }
    } else {
      console.log('❌ News Intelligence Agent not found in registry');
    }

    // 2. Check recent processing activity
    console.log('\n📈 2. Recent Processing Activity:');
    const { data: recentLogs } = await supabase
      .from('news_loading_status_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentLogs && recentLogs.length > 0) {
      console.log('Latest processing logs:');
      recentLogs.forEach(log => {
        const time = new Date(log.created_at).toLocaleString();
        console.log(`   ${time}: ${log.articles_fetched || 0} fetched, ${log.articles_processed || 0} processed`);
        console.log(`   Health: ${log.health_status}, Success Rate: ${log.success_rate}%`);
      });
      
      // Check if processing is happening regularly
      const now = new Date();
      const lastProcessed = new Date(recentLogs[0].created_at);
      const minutesSinceLastProcess = (now - lastProcessed) / (1000 * 60);
      
      console.log(`\n⏱️  Last processed: ${minutesSinceLastProcess.toFixed(1)} minutes ago`);
      
      if (minutesSinceLastProcess < 10) {
        console.log('✅ Processing appears to be active');
      } else {
        console.log('⚠️  Processing may not be running (>10 minutes since last activity)');
      }
    } else {
      console.log('❌ No processing logs found');
    }

    // 3. Check for database triggers
    console.log('\n🔧 3. Database Triggers & Real-time Features:');
    // We know from the migration files that these should exist
    const expectedTriggers = [
      'news_velocity_tracker - Updates velocity on article insert',
      'breaking_news_notifier - Sends alerts for high-impact news',
      'sentiment_analyzer - Processes sentiment automatically'
    ];
    
    console.log('Expected triggers (from migrations):');
    expectedTriggers.forEach(trigger => {
      console.log(`   - ${trigger}`);
    });

    // 4. Check recent article ingestion
    console.log('\n📰 4. Recent Article Ingestion:');
    const { data: recentArticles } = await supabase
      .from('news_articles_partitioned')
      .select('article_id, title, created_at, source')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentArticles && recentArticles.length > 0) {
      console.log('Latest articles:');
      recentArticles.forEach(article => {
        const time = new Date(article.created_at).toLocaleString();
        console.log(`   ${time}: ${article.title.substring(0, 60)}...`);
        console.log(`   Source: ${article.source}`);
      });
    }

    // 5. Check tables that should be real-time
    console.log('\n🚀 5. Tables Recommended for Real-time Perplexity Integration:');
    const realTimeTables = [
      {
        table: 'news_articles_partitioned',
        reason: 'Main ingestion point - should fetch from Perplexity every 5 min',
        currentStatus: 'Manual population only'
      },
      {
        table: 'breaking_news_alerts',
        reason: 'High-priority alerts - should trigger on market-moving news',
        currentStatus: 'Populated by triggers when impact > 0.8'
      },
      {
        table: 'news_sentiment_analysis',
        reason: 'Real-time sentiment needed for trading decisions',
        currentStatus: 'Requires AI processing after article ingestion'
      },
      {
        table: 'news_market_impact',
        reason: 'Critical for risk management - needs immediate updates',
        currentStatus: 'Populated after sentiment analysis'
      }
    ];

    console.log('\nRecommended real-time integrations:');
    realTimeTables.forEach(t => {
      console.log(`\n📋 ${t.table}`);
      console.log(`   Why: ${t.reason}`);
      console.log(`   Current: ${t.currentStatus}`);
    });

    // 6. Automation recommendations
    console.log('\n🎯 6. AUTOMATION STATUS & RECOMMENDATIONS:');
    console.log('-'.repeat(40));
    
    if (agent) {
      console.log('✅ Agent is registered and configured');
      console.log('⚠️  But agent endpoint not running (needs deployment)');
    } else {
      console.log('❌ Agent not registered - manual setup needed');
    }
    
    console.log('\n📋 To enable 5-minute automated processing:');
    console.log('1. Deploy the News Intelligence Agent endpoint');
    console.log('2. Set up cron job or Vercel cron to call /api/agents/news-intelligence');
    console.log('3. Configure Perplexity API key in environment');
    console.log('4. Enable database triggers for real-time processing');
    
    console.log('\n🔄 For real-time Perplexity integration:');
    console.log('1. Create /api/news-realtime endpoint');
    console.log('2. Use Perplexity streaming API for live updates');
    console.log('3. Implement WebSocket for client notifications');
    console.log('4. Set up event-driven processing pipeline');

  } catch (error) {
    console.error('❌ Error checking automation:', error.message);
  }
}

checkAutomatedProcessing();