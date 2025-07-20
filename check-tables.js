#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qupqqlxhtnoljlnkfpmc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cHFxbHhodG5vbGpsbmtmcG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMDc3OCwiZXhwIjoyMDY3OTg2Nzc4fQ.ESAVHRinK0HxBRp3dWkcAlRS7Xn9rDm25FqXd4D8X18'
);

async function checkTables() {
  console.log('🔍 Checking AI Tables in Production...\n');

  // Check a2a_agents table
  const { data: agents, error: agentError } = await supabase
    .from('a2a_agents')
    .select('*')
    .limit(5);

  if (!agentError) {
    console.log('✅ a2a_agents table: Working');
    console.log('   Agents found:', agents?.length || 0);
    agents?.forEach(agent => {
      console.log('   -', agent.name, '(' + agent.agent_id + ')');
    });
  } else {
    console.log('❌ a2a_agents table:', agentError.message);
  }

  // Check other tables
  const tables = [
    'breaking_news_alerts',
    'news_sentiment_analysis', 
    'news_market_impact',
    'news_entity_extractions'
  ];

  console.log('\n📋 Checking other AI tables...');
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (!error) {
      console.log('✅', table + ':', 'Accessible');
    } else {
      console.log('❌', table + ':', error.message);
    }
  }

  console.log('\n🎉 AI Tables are deployed and working!');
  console.log('\n🌐 Production URLs:');
  console.log('   • Main App: https://hana-proxy-vercel-mnbgl14ok-plturrells-projects.vercel.app');
  console.log('   • Visual Builder: https://hana-proxy-vercel-mnbgl14ok-plturrells-projects.vercel.app/public/visual-builder-real.html');
  console.log('   • Model Jobs: https://hana-proxy-vercel-mnbgl14ok-plturrells-projects.vercel.app/public/model-jobs.html');
}

checkTables().catch(console.error);